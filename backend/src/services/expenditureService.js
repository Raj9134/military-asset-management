import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import { resolveBaseScope } from "../middleware/baseScope.js";
import { applyMovement, assertSufficientForExpenditure, getBalance, MOVEMENT } from "./inventoryService.js";
import { createWithReference, REFERENCE_PREFIX } from "../utils/reference.js";
import * as audit from "./auditService.js";

/**
 * Expenditures.
 *
 * Writing equipment off genuinely leaves the inventory, so unlike an assignment
 * this lowers onHandQuantity.
 *
 * The important part is the optional link to an assignment. Equipment issued to
 * a soldier and then consumed in training has to clear both columns:
 * onHand, because it is gone, and committed, because the outstanding obligation
 * has been discharged. Recording the link is what makes that possible. Without
 * it the same unit is counted twice, once as missing stock and once as stock
 * still owed back.
 */

const LIST_INCLUDE = {
  equipmentType: { select: { id: true, code: true, name: true, unitOfMeasure: true } },
  base: { select: { id: true, code: true, name: true } },
  recordedBy: { select: { id: true, name: true, email: true } },
  assignment: {
    select: { id: true, referenceNumber: true, personnelName: true, quantity: true, returnedQuantity: true },
  },
  reversal: { select: { id: true, referenceNumber: true } },
  reversedBy: { select: { id: true, referenceNumber: true } },
};

function buildWhere(filters, user) {
  const where = { ...resolveBaseScope(user, filters.baseId) };
  if (filters.equipmentTypeId) where.equipmentTypeId = filters.equipmentTypeId;
  if (filters.reason) where.reason = filters.reason;
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    where.expenditureDate = {};
    if (filters.dateFrom) where.expenditureDate.gte = filters.dateFrom;
    if (filters.dateTo) where.expenditureDate.lte = filters.dateTo;
  }
  return where;
}

export async function list(filters, user) {
  const where = buildWhere(filters, user);
  const [total, data] = await Promise.all([
    prisma.expenditure.count({ where }),
    prisma.expenditure.findMany({
      where,
      orderBy: [{ expenditureDate: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: LIST_INCLUDE,
    }),
  ]);
  return { total, data };
}

export async function getById(id, user) {
  const expenditure = await prisma.expenditure.findUnique({ where: { id }, include: LIST_INCLUDE });
  if (!expenditure) throw ApiError.notFound("Expenditure not found");
  if (user.role !== ROLES.ADMIN && expenditure.baseId !== user.baseId) {
    throw ApiError.notFound("Expenditure not found");
  }
  return expenditure;
}

export async function create(payload, req) {
  const user = req.user;
  resolveBaseScope(user, payload.baseId);

  const base = await prisma.base.findUnique({ where: { id: payload.baseId }, select: { id: true, isActive: true } });
  if (!base) throw ApiError.badRequest("Base does not exist");
  if (!base.isActive) throw ApiError.badRequest("Cannot record expenditure at an inactive base");

  const equipmentType = await prisma.equipmentType.findUnique({
    where: { id: payload.equipmentTypeId },
    select: { id: true, isActive: true },
  });
  if (!equipmentType) throw ApiError.badRequest("Equipment type does not exist");
  if (!equipmentType.isActive) throw ApiError.badRequest("Equipment type is inactive");

  // When an assignment is referenced it must belong to the same base and the
  // same equipment type, otherwise the link would clear committed stock from an
  // unrelated balance.
  let assignment = null;
  if (payload.assignmentId) {
    assignment = await prisma.assignment.findUnique({
      where: { id: payload.assignmentId },
      select: {
        id: true,
        baseId: true,
        equipmentTypeId: true,
        quantity: true,
        returnedQuantity: true,
        status: true,
      },
    });

    if (!assignment) throw ApiError.badRequest("Assignment does not exist");
    if (assignment.baseId !== payload.baseId) {
      throw ApiError.badRequest("That assignment belongs to a different base");
    }
    if (assignment.equipmentTypeId !== payload.equipmentTypeId) {
      throw ApiError.badRequest("That assignment covers different equipment");
    }

    const outstanding = assignment.quantity - assignment.returnedQuantity;
    if (outstanding === 0) {
      throw ApiError.conflict("That assignment has already been fully returned");
    }
  } else {
    // An unlinked write-off leaves committed stock untouched, so on-hand must
    // stay above the committed total or the database would reject the row.
    // Catching it here turns what would be a 500 into an explanation of what
    // the caller needs to do instead.
    const balance = await getBalance(payload.baseId, payload.equipmentTypeId);
    if (balance.onHandQuantity - payload.quantity < balance.committedQuantity) {
      throw ApiError.conflict(
        "That equipment is already issued to personnel. Link the expenditure to the assignment it was consumed from."
      );
    }
  }

  const expenditure = await prisma.$transaction(async (tx) => {
    // Expenditure checks physical stock, not available stock. Consuming
    // equipment that is already issued to personnel is the normal case, so
    // committed units must not be excluded here.
    await assertSufficientForExpenditure(tx, {
      baseId: payload.baseId,
      equipmentTypeId: payload.equipmentTypeId,
      quantity: payload.quantity,
    });

    const created = await createWithReference(
      tx,
      "expenditure",
      {
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        expenditureDate: payload.expenditureDate,
        reason: payload.reason,
        notes: payload.notes || null,
        status: "ACTIVE",
        assignmentId: payload.assignmentId || null,
        recordedById: user.id,
      },
      REFERENCE_PREFIX.EXPENDITURE
    );

    if (assignment) {
      // One movement clears both columns, so the unit is not written off twice.
      await applyMovement(tx, {
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        movement: MOVEMENT.EXPEND_ISSUED,
      });

      const returned = assignment.returnedQuantity + payload.quantity;
      const settled = returned >= assignment.quantity;

      // The obligation is discharged without equipment coming back, so the
      // assignment is closed rather than left open forever.
      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          returnedQuantity: returned,
          status: settled ? "RETURNED" : "PARTIALLY_RETURNED",
          notes: "Consumed in the field.",
        },
      });
    } else {
      await applyMovement(tx, {
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        movement: MOVEMENT.RELEASE_ON_HAND,
      });
    }

    await audit.record({
      req,
      tx,
      action: "EXPENDITURE_CREATED",
      entityType: "Expenditure",
      entityId: created.id,
      metadata: {
        referenceNumber: created.referenceNumber,
        baseId: payload.baseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        reason: payload.reason,
        assignmentId: payload.assignmentId || null,
      },
    });

    return created;
  });

  return prisma.expenditure.findUnique({ where: { id: expenditure.id }, include: LIST_INCLUDE });
}

/**
 * Corrects an expenditure that was recorded in error.
 *
 * The original is marked REVERSED so it stops counting, and stock is credited
 * back. If it was written off against an assignment, the assignment is reopened
 * so the equipment is treated as still issued rather than silently returned.
 */
export async function reverse(id, payload, req) {
  const existing = await prisma.expenditure.findUnique({
    where: { id },
    include: { assignment: { select: { id: true, quantity: true, returnedQuantity: true } } },
  });

  if (!existing) throw ApiError.notFound("Expenditure not found");
  if (existing.status === "REVERSED") {
    throw ApiError.conflict("This expenditure has already been reversed");
  }

  const expenditure = await prisma.$transaction(async (tx) => {
    const marked = await tx.expenditure.update({ where: { id }, data: { status: "REVERSED" } });

    const reversal = await createWithReference(
      tx,
      "expenditure",
      {
        baseId: marked.baseId,
        equipmentTypeId: marked.equipmentTypeId,
        quantity: marked.quantity,
        expenditureDate: new Date(),
        reason: marked.reason,
        notes: `Reversal of ${marked.referenceNumber}: ${payload.reason}`,
        status: "REVERSED",
        reversedById: marked.id,
        assignmentId: null,
        recordedById: req.user.id,
      },
      REFERENCE_PREFIX.EXPENDITURE
    );

    // Crediting back is an inbound movement. It goes through the same guarded
    // path as a purchase, so it cannot manufacture stock that was never there.
    await applyMovement(tx, {
      baseId: marked.baseId,
      equipmentTypeId: marked.equipmentTypeId,
      quantity: marked.quantity,
      movement: MOVEMENT.RECEIVE,
    });

    if (existing.assignment) {
      await tx.assignment.update({
        where: { id: existing.assignment.id },
        data: {
          returnedQuantity: Math.max(0, existing.assignment.returnedQuantity - marked.quantity),
          status: "ACTIVE",
        },
      });
    }

    await audit.record({
      req,
      tx,
      action: "EXPENDITURE_REVERSED",
      entityType: "Expenditure",
      entityId: marked.id,
      metadata: {
        originalReference: marked.referenceNumber,
        reversalReference: reversal.referenceNumber,
        quantity: marked.quantity,
        reason: payload.reason,
      },
    });

    return marked;
  });

  return prisma.expenditure.findUnique({ where: { id: expenditure.id }, include: LIST_INCLUDE });
}

export async function totals({ baseId, equipmentTypeId, dateFrom, dateTo, user }) {
  const scope = resolveBaseScope(user, baseId);
  const where = { ...scope, status: "ACTIVE" };
  if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId;
  if (dateFrom || dateTo) {
    where.expenditureDate = {};
    if (dateFrom) where.expenditureDate.gte = dateFrom;
    if (dateTo) where.expenditureDate.lte = dateTo;
  }

  const result = await prisma.expenditure.aggregate({ where, _sum: { quantity: true } });
  return { expended: result._sum.quantity ?? 0 };
}
