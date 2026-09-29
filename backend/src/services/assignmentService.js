import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import { resolveBaseScope } from "../middleware/baseScope.js";
import { applyMovement, assertSufficientForIssue, MOVEMENT } from "./inventoryService.js";
import { createWithReference, REFERENCE_PREFIX } from "../utils/reference.js";
import * as audit from "./auditService.js";

/**
 * Assignments.
 *
 * Issuing equipment is not expenditure. The equipment is still at the base, it
 * is simply no longer free to be promised to somebody else, so this raises
 * committedQuantity rather than lowering onHandQuantity.
 *
 * A return reverses that. Because the equipment never physically left, a return
 * must not touch onHand: doing so would deduct stock that is still sitting in
 * the stores.
 */

const LIST_INCLUDE = {
  equipmentType: { select: { id: true, code: true, name: true, unitOfMeasure: true, isTrackable: true } },
  asset: { select: { id: true, assetNumber: true, serialNumber: true, status: true } },
  base: { select: { id: true, code: true, name: true } },
  assignedBy: { select: { id: true, name: true, email: true } },
};

function buildWhere(filters, user) {
  const where = { ...resolveBaseScope(user, filters.baseId) };
  if (filters.equipmentTypeId) where.equipmentTypeId = filters.equipmentTypeId;
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    where.assignmentDate = {};
    if (filters.dateFrom) where.assignmentDate.gte = filters.dateFrom;
    if (filters.dateTo) where.assignmentDate.lte = filters.dateTo;
  }
  return where;
}

export async function list(filters, user) {
  const where = buildWhere(filters, user);
  const [total, data] = await Promise.all([
    prisma.assignment.count({ where }),
    prisma.assignment.findMany({
      where,
      orderBy: [{ assignmentDate: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: LIST_INCLUDE,
    }),
  ]);
  return { total, data };
}

export async function getById(id, user) {
  const assignment = await prisma.assignment.findUnique({ where: { id }, include: LIST_INCLUDE });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  // 404 for anything outside scope, so ids cannot be probed for other bases.
  if (user.role !== ROLES.ADMIN && assignment.baseId !== user.baseId) {
    throw ApiError.notFound("Assignment not found");
  }
  return assignment;
}

export async function create(payload, req) {
  const user = req.user;
  resolveBaseScope(user, payload.baseId);

  const base = await prisma.base.findUnique({ where: { id: payload.baseId }, select: { id: true, isActive: true } });
  if (!base) throw ApiError.badRequest("Base does not exist");
  if (!base.isActive) throw ApiError.badRequest("Cannot assign equipment at an inactive base");

  let asset = null;
  let equipmentTypeId = payload.equipmentTypeId;

  if (payload.assetId) {
    asset = await prisma.asset.findUnique({
      where: { id: payload.assetId },
      select: { id: true, currentBaseId: true, status: true, equipmentTypeId: true },
    });

    if (!asset) throw ApiError.badRequest("Asset does not exist");
    if (asset.currentBaseId !== payload.baseId) {
      throw ApiError.badRequest("That asset is not held at the selected base");
    }
    if (asset.status !== "IN_STOCK") {
      throw ApiError.conflict(`That asset is currently ${asset.status.toLowerCase().replace("_", " ")} and cannot be issued`);
    }

    // A named asset implies its own equipment type. Taking both from the client
    // would let an assault rifle be recorded against the ammunition balance.
    equipmentTypeId = asset.equipmentTypeId;
  }

  const equipmentType = await prisma.equipmentType.findUnique({
    where: { id: equipmentTypeId },
    select: { id: true, isActive: true, isTrackable: true },
  });
  if (!equipmentType) throw ApiError.badRequest("Equipment type does not exist");
  if (!equipmentType.isActive) throw ApiError.badRequest("Equipment type is inactive");

  const assignment = await prisma.$transaction(async (tx) => {
    if (!payload.assetId) {
      // Available is onHand minus what is already promised to somebody else.
      // The guard gives a readable message; the conditional update inside
      // applyMovement is what actually prevents a double issue.
      await assertSufficientForIssue(tx, {
        baseId: payload.baseId,
        equipmentTypeId,
        quantity: payload.quantity,
      });
    }

    const created = await createWithReference(
      tx,
      "assignment",
      {
        baseId: payload.baseId,
        equipmentTypeId: payload.assetId ? null : equipmentTypeId,
        assetId: payload.assetId || null,
        personnelName: payload.personnelName,
        personnelId: payload.personnelId || null,
        designation: payload.designation || null,
        quantity: payload.quantity,
        returnedQuantity: 0,
        assignmentDate: payload.assignmentDate,
        status: "ACTIVE",
        assignedById: user.id,
        notes: payload.notes || null,
      },
      REFERENCE_PREFIX.ASSIGNMENT
    );

    if (!payload.assetId) {
      await applyMovement(tx, {
        baseId: payload.baseId,
        equipmentTypeId,
        quantity: payload.quantity,
        movement: MOVEMENT.COMMIT,
      });
    }

    if (asset) {
      await tx.asset.update({ where: { id: asset.id }, data: { status: "ASSIGNED" } });
    }

    await audit.record({
      req,
      tx,
      action: "ASSIGNMENT_CREATED",
      entityType: "Assignment",
      entityId: created.id,
      metadata: {
        referenceNumber: created.referenceNumber,
        baseId: payload.baseId,
        equipmentTypeId,
        assetId: payload.assetId || null,
        personnelName: payload.personnelName,
        quantity: payload.quantity,
      },
    });

    return created;
  });

  return prisma.assignment.findUnique({ where: { id: assignment.id }, include: LIST_INCLUDE });
}

/**
 * Records equipment coming back.
 *
 * A partial return is normal, so the status moves through
 * PARTIALLY_RETURNED rather than jumping straight to RETURNED, and only the
 * returned portion is released from committed stock.
 */
export async function returnEquipment(id, payload, req) {
  const existing = await prisma.assignment.findUnique({
    where: { id },
    include: { asset: { select: { id: true, status: true } } },
  });

  if (!existing) throw ApiError.notFound("Assignment not found");
  if (req.user.role !== ROLES.ADMIN && existing.baseId !== req.user.baseId) {
    throw ApiError.notFound("Assignment not found");
  }
  if (existing.status === "RETURNED") {
    throw ApiError.conflict("This assignment has already been fully returned");
  }

  const outstanding = existing.quantity - existing.returnedQuantity;
  if (payload.returnedQuantity > outstanding) {
    throw ApiError.badRequest(
      `Only ${outstanding} outstanding on this assignment, ${payload.returnedQuantity} requested`
    );
  }

  const equipmentTypeId = existing.equipmentTypeId ?? existing.assetId;

  const updated = await prisma.$transaction(async (tx) => {
    const totalReturned = existing.returnedQuantity + payload.returnedQuantity;
    const fullyReturned = totalReturned >= existing.quantity;

    // Only a bulk assignment moves stock. A named asset is tracked through the
    // Asset row's status instead, because its quantity is always one.
    if (!existing.assetId) {
      await applyMovement(tx, {
        baseId: existing.baseId,
        equipmentTypeId,
        quantity: payload.returnedQuantity,
        movement: MOVEMENT.RELEASE_COMMITTED,
      });
    }

    const record = await tx.assignment.update({
      where: { id },
      data: {
        returnedQuantity: totalReturned,
        status: fullyReturned ? "RETURNED" : "PARTIALLY_RETURNED",
        notes: payload.notes
          ? `${existing.notes ? `${existing.notes} | ` : ""}${payload.notes}`
          : existing.notes,
      },
    });

    if (existing.asset && fullyReturned) {
      await tx.asset.update({ where: { id: existing.asset.id }, data: { status: "IN_STOCK" } });
    }

    await audit.record({
      req,
      tx,
      action: "ASSIGNMENT_RETURNED",
      entityType: "Assignment",
      entityId: id,
      metadata: {
        referenceNumber: existing.referenceNumber,
        returnedQuantity: payload.returnedQuantity,
        outstandingBefore: outstanding,
        status: record.status,
      },
    });

    return record;
  });

  return prisma.assignment.findUnique({ where: { id: updated.id }, include: LIST_INCLUDE });
}

/** Outstanding issued quantities, used by the dashboard. */
export async function outstandingTotals({ baseId, equipmentTypeId, user }) {
  const scope = resolveBaseScope(user, baseId);
  const result = await prisma.assignment.aggregate({
    where: {
      ...scope,
      ...(equipmentTypeId ? { equipmentTypeId } : {}),
      status: { in: ["ACTIVE", "PARTIALLY_RETURNED"] },
    },
    _sum: { quantity: true, returnedQuantity: true },
  });

  const issued = result._sum.quantity ?? 0;
  const returned = result._sum.returnedQuantity ?? 0;
  return { assigned: issued - returned };
}
