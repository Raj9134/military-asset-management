import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import { resolveBaseScope } from "../middleware/baseScope.js";
import { applyMovement, MOVEMENT } from "./inventoryService.js";
import { createWithReference, REFERENCE_PREFIX } from "../utils/reference.js";
import * as audit from "./auditService.js";

/**
 * Purchases.
 *
 * A purchase is an append-only ledger entry that increases stock. It is never
 * edited and never deleted: a mistake is corrected by recording a reversal, so
 * the original record stays visible alongside the correction.
 *
 * Every write runs inside a single transaction covering the ledger row, the
 * stock movement and the audit entry. That is what makes "purchases" and "stock
 * on hand" impossible to disagree.
 */

const LIST_INCLUDE = {
  equipmentType: { select: { id: true, code: true, name: true, category: true, unitOfMeasure: true } },
  base: { select: { id: true, code: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  reversal: { select: { id: true, referenceNumber: true } },
  reversedBy: { select: { id: true, referenceNumber: true } },
};

function buildWhere(filters, user) {
  // The scope is merged into the query rather than checked afterwards, so a
  // base commander cannot read another base's purchases even by guessing an id.
  const scope = resolveBaseScope(user, filters.baseId);

  const where = { ...scope };

  if (filters.equipmentTypeId) where.equipmentTypeId = filters.equipmentTypeId;
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    where.purchaseDate = {};
    if (filters.dateFrom) where.purchaseDate.gte = filters.dateFrom;
    if (filters.dateTo) where.purchaseDate.lte = filters.dateTo;
  }

  return where;
}

export async function list(filters, user) {
  const where = buildWhere(filters, user);

  const [total, data] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      orderBy: [{ purchaseDate: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: LIST_INCLUDE,
    }),
  ]);

  return { total, data };
}

export async function getById(id, user) {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include: LIST_INCLUDE });

  if (!purchase) {
    throw ApiError.notFound("Purchase not found");
  }

  // 404 rather than 403 for a record outside the caller's scope. A 403 would
  // confirm the record exists, which turns the endpoint into a way to probe for
  // other bases' activity by walking ids.
  if (user.role !== ROLES.ADMIN && purchase.baseId !== user.baseId) {
    throw ApiError.notFound("Purchase not found");
  }

  return purchase;
}

export async function create(payload, req) {
  const user = req.user;

  // A non-admin may only purchase into their own base. resolveBaseScope raises
  // 403 when they ask for anywhere else.
  resolveBaseScope(user, payload.baseId);

  const base = await prisma.base.findUnique({ where: { id: payload.baseId }, select: { id: true, isActive: true } });
  if (!base) throw ApiError.badRequest("Base does not exist");
  if (!base.isActive) throw ApiError.badRequest("Cannot purchase into an inactive base");

  const equipmentType = await prisma.equipmentType.findUnique({
    where: { id: payload.equipmentTypeId },
    select: { id: true, isActive: true },
  });
  if (!equipmentType) throw ApiError.badRequest("Equipment type does not exist");
  if (!equipmentType.isActive) throw ApiError.badRequest("Cannot purchase an inactive equipment type");

  // One transaction across the ledger row, the stock movement and the audit
  // entry. If any part fails, none of it survives.
  const purchase = await prisma.$transaction(async (tx) => {
    const created = await createWithReference(
      tx,
      "purchase",
      {
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice ?? null,
        supplier: payload.supplier || null,
        purchaseDate: payload.purchaseDate,
        notes: payload.notes || null,
        status: "ACTIVE",
        createdById: user.id,
      },
      REFERENCE_PREFIX.PURCHASE
    );

    await applyMovement(tx, {
      baseId: payload.baseId,
      equipmentTypeId: payload.equipmentTypeId,
      quantity: payload.quantity,
      movement: MOVEMENT.RECEIVE,
    });

    await audit.record({
      req,
      tx,
      action: "PURCHASE_CREATED",
      entityType: "Purchase",
      entityId: created.id,
      metadata: {
        referenceNumber: created.referenceNumber,
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        supplier: payload.supplier || null,
      },
    });

    return created;
  });

  return prisma.purchase.findUnique({ where: { id: purchase.id }, include: LIST_INCLUDE });
}

/**
 * Records a reversal rather than deleting the original.
 *
 * The original row is marked REVERSED so it stops counting towards balances, and
 * a matching reversal row is written that points back at it. The unique
 * constraint on reversedById is what prevents a second reversal crediting the
 * same purchase twice.
 *
 * Stock is only returned if it is still there to return. A purchase that has
 * already been issued or expended cannot simply be undone, and silently
 * producing a negative balance would be worse than refusing.
 */
export async function reverse(id, payload, req) {
  const existing = await prisma.purchase.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound("Purchase not found");
  }

  if (existing.status === "REVERSED") {
    throw ApiError.conflict("This purchase has already been reversed");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    const marked = await tx.purchase.update({
      where: { id },
      data: { status: "REVERSED" },
    });

    // The reversal row is written with a positive quantity because the database
    // forbids negative quantities. It is marked REVERSED as well, so neither row
    // contributes to the aggregate; the net effect comes from the stock movement
    // below. This keeps the CHECK constraint honest while still recording the
    // correction as a queryable row.
    const reversal = await createWithReference(
      tx,
      "purchase",
      {
        baseId: marked.baseId,
        equipmentTypeId: marked.equipmentTypeId,
        quantity: marked.quantity,
        unitPrice: marked.unitPrice,
        supplier: marked.supplier,
        purchaseDate: new Date(),
        notes: `Reversal of ${marked.referenceNumber}: ${payload.reason}`,
        status: "REVERSED",
        reversedById: marked.id,
        createdById: req.user.id,
      },
      REFERENCE_PREFIX.PURCHASE
    );

    await applyMovement(tx, {
      baseId: marked.baseId,
      equipmentTypeId: marked.equipmentTypeId,
      quantity: marked.quantity,
      movement: MOVEMENT.RELEASE_ON_HAND,
    });

    await audit.record({
      req,
      tx,
      action: "PURCHASE_REVERSED",
      entityType: "Purchase",
      entityId: marked.id,
      metadata: {
        originalReference: marked.referenceNumber,
        reversalReference: reversal.referenceNumber,
        baseId: marked.baseId,
        equipmentTypeId: marked.equipmentTypeId,
        quantity: marked.quantity,
        reason: payload.reason,
      },
    });

    return marked;
  });

  return prisma.purchase.findUnique({ where: { id: purchase.id }, include: LIST_INCLUDE });
}

/** Totals for a base and equipment pair, used by the dashboard summary. */
export async function totals({ baseId, equipmentTypeId, dateFrom, dateTo, user }) {
  const scope = resolveBaseScope(user, baseId);

  const where = { ...scope, status: "ACTIVE" };
  if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
  if (dateFrom || dateTo) {
    where.purchaseDate = {};
    if (dateFrom) where.purchaseDate.gte = dateFrom;
    if (dateTo) where.purchaseDate.lte = dateTo;
  }

  const result = await prisma.purchase.aggregate({ where, _sum: { quantity: true } });
  return { quantity: result._sum.quantity ?? 0 };
}
