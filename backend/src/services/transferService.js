import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import { applyMovement, assertSufficientForIssue, MOVEMENT } from "./inventoryService.js";
import { createWithReference, REFERENCE_PREFIX } from "../utils/reference.js";
import * as audit from "./auditService.js";

/**
 * Transfers.
 *
 * The lifecycle is:
 *
 *   PENDING ──approve──> APPROVED ──complete──> COMPLETED
 *      │                    │
 *      ├──reject──> REJECTED
 *      └──cancel──> CANCELLED <──cancel── (also from APPROVED)
 *
 * Only COMPLETED moves stock. A pending transfer is a request, and treating it
 * as movement would let any logistics officer freeze inventory simply by
 * raising requests they never intend to complete.
 *
 * Completion is the only step that touches balances, and it does both sides in
 * one transaction. A transfer that took stock out without recording the arrival
 * would silently destroy equipment, and there is no way to detect that from the
 * ledger afterwards.
 */

const LIST_INCLUDE = {
  equipmentType: { select: { id: true, code: true, name: true, unitOfMeasure: true } },
  sourceBase: { select: { id: true, code: true, name: true } },
  destinationBase: { select: { id: true, code: true, name: true } },
  initiatedBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
};

function buildWhere(filters, user) {
  const where = {};

  if (user.role !== ROLES.ADMIN) {
    // A non-admin sees transfers touching their own base at either end, but
    // never a transfer between two bases they have no stake in.
    if (user.baseId) {
      where.OR = [{ sourceBaseId: user.baseId }, { destinationBaseId: user.baseId }];
    } else {
      // No base assigned means nothing is visible rather than everything.
      where.id = -1;
    }
  } else if (filters.baseId) {
    if (filters.direction === "inbound") where.destinationBaseId = filters.baseId;
    else if (filters.direction === "outbound") where.sourceBaseId = filters.baseId;
    else {
      where.OR = [{ sourceBaseId: filters.baseId }, { destinationBaseId: filters.baseId }];
    }
  }

  if (filters.equipmentTypeId) where.equipmentTypeId = filters.equipmentTypeId;
  if (filters.status) where.status = filters.status;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  return where;
}

export async function list(filters, user) {
  const where = buildWhere(filters, user);

  const [total, data] = await Promise.all([
    prisma.transfer.count({ where }),
    prisma.transfer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: LIST_INCLUDE,
    }),
  ]);

  return { total, data };
}

export async function getById(id, user) {
  const transfer = await prisma.transfer.findUnique({ where: { id }, include: LIST_INCLUDE });
  if (!transfer) throw ApiError.notFound("Transfer not found");

  if (!canSee(user, transfer)) {
    throw ApiError.notFound("Transfer not found");
  }

  return transfer;
}

function canSee(user, transfer) {
  if (user.role === ROLES.ADMIN) return true;
  return transfer.sourceBaseId === user.baseId || transfer.destinationBaseId === user.baseId;
}

function canActAsSource(user, transfer) {
  return user.role === ROLES.ADMIN || transfer.sourceBaseId === user.baseId;
}

function canActAsDestination(user, transfer) {
  return user.role === ROLES.ADMIN || transfer.destinationBaseId === user.baseId;
}

export async function create(payload, req) {
  const user = req.user;

  if (!canActAsSource(user, { sourceBaseId: payload.sourceBaseId, destinationBaseId: payload.destinationBaseId })) {
    throw ApiError.forbidden("You can only initiate transfers from your own base");
  }

  const [source, destination, equipmentType] = await Promise.all([
    prisma.base.findUnique({ where: { id: payload.sourceBaseId }, select: { id: true, isActive: true } }),
    prisma.base.findUnique({ where: { id: payload.destinationBaseId }, select: { id: true, isActive: true } }),
    prisma.equipmentType.findUnique({ where: { id: payload.equipmentTypeId }, select: { id: true, isActive: true } }),
  ]);

  if (!source) throw ApiError.badRequest("Source base does not exist");
  if (!destination) throw ApiError.badRequest("Destination base does not exist");
  if (!source.isActive || !destination.isActive) {
    throw ApiError.badRequest("Both bases must be active to transfer equipment");
  }
  if (!equipmentType) throw ApiError.badRequest("Equipment type does not exist");
  if (!equipmentType.isActive) throw ApiError.badRequest("Equipment type is inactive");

  // Stock is checked at creation for a useful error message, but the real
  // guarantee is the conditional update inside complete(). A transfer can sit
  // pending for days, and stock may have moved since it was raised.
  const transfer = await prisma.$transaction(async (tx) => {
    const created = await createWithReference(
      tx,
      "transfer",
      {
        sourceBaseId: payload.sourceBaseId,
        destinationBaseId: payload.destinationBaseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
        status: "PENDING",
        initiatedById: user.id,
        notes: payload.notes || null,
      },
      REFERENCE_PREFIX.TRANSFER
    );

    await audit.record({
      req,
      tx,
      action: "TRANSFER_CREATED",
      entityType: "Transfer",
      entityId: created.id,
      metadata: {
        referenceNumber: created.referenceNumber,
        sourceBaseId: payload.sourceBaseId,
        destinationBaseId: payload.destinationBaseId,
        equipmentTypeId: payload.equipmentTypeId,
        quantity: payload.quantity,
      },
    });

    return created;
  });

  return prisma.transfer.findUnique({ where: { id: transfer.id }, include: LIST_INCLUDE });
}

export async function approve(id, payload, req) {
  const transfer = await requireTransition(id, ["PENDING"], req, canActAsSource);

  // Four eyes. The person who raised the transfer cannot also sign it off,
  // otherwise the approval step proves nothing.
  if (transfer.initiatedById === req.user.id) {
    throw ApiError.forbidden("A transfer cannot be approved by the person who initiated it");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.update({
      where: { id },
      data: { status: "APPROVED", approvedById: req.user.id, decisionReason: payload.reason || null },
    });

    await audit.record({
      req,
      tx,
      action: "TRANSFER_APPROVED",
      entityType: "Transfer",
      entityId: id,
      metadata: { referenceNumber: transfer.referenceNumber, decidedBy: req.user.email },
    });

    return updated;
  });
}

export async function reject(id, payload, req) {
  const transfer = await requireTransition(id, ["PENDING"], req, canActAsSource);

  if (transfer.initiatedById === req.user.id) {
    throw ApiError.forbidden("A transfer cannot be rejected by the person who initiated it");
  }

  if (!payload.reason) {
    throw ApiError.badRequest("A reason is required when rejecting a transfer");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.update({
      where: { id },
      data: { status: "REJECTED", approvedById: req.user.id, decisionReason: payload.reason },
    });

    await audit.record({
      req,
      tx,
      action: "TRANSFER_REJECTED",
      entityType: "Transfer",
      entityId: id,
      metadata: { referenceNumber: transfer.referenceNumber, reason: payload.reason },
    });

    return updated;
  });
}

export async function cancel(id, req) {
  // Cancellation is allowed to whoever raised the transfer, or an admin. This
  // differs from approve and reject, where the caller must be at the source base
  // and must not be the initiator.
  const canCancel = (user, transfer) =>
    user.role === ROLES.ADMIN || transfer.initiatedById === user.id;

  const transfer = await requireTransition(id, ["PENDING", "APPROVED"], req, canCancel);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transfer.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await audit.record({
      req,
      tx,
      action: "TRANSFER_CANCELLED",
      entityType: "Transfer",
      entityId: id,
      metadata: { referenceNumber: transfer.referenceNumber },
    });

    return updated;
  });
}

/**
 * Completing the transfer. This is the only step that moves stock, and it moves
 * both sides inside one transaction.
 */
export async function complete(id, payload, req) {
  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer) throw ApiError.notFound("Transfer not found");

  if (transfer.status !== "APPROVED") {
    throw ApiError.conflict(`Only an approved transfer can be completed. Current status: ${transfer.status}`);
  }

  // Receipt is the receiving base's responsibility, not the sender's.
  if (!canActAsDestination(req.user, transfer)) {
    throw ApiError.forbidden("Only the destination base or an administrator can complete this transfer");
  }

  const completed = await prisma.$transaction(async (tx) => {
    // Guards give a readable error; the conditional UPDATE in applyMovement is
    // what actually prevents an overdraft when two transfers are completed at
    // the same moment.
    await assertSufficientForIssue(tx, {
      baseId: transfer.sourceBaseId,
      equipmentTypeId: transfer.equipmentTypeId,
      quantity: transfer.quantity,
    });

    await applyMovement(tx, {
      baseId: transfer.sourceBaseId,
      equipmentTypeId: transfer.equipmentTypeId,
      quantity: transfer.quantity,
      movement: MOVEMENT.RELEASE_ON_HAND,
    });

    await applyMovement(tx, {
      baseId: transfer.destinationBaseId,
      equipmentTypeId: transfer.equipmentTypeId,
      quantity: transfer.quantity,
      movement: MOVEMENT.RECEIVE,
    });

    const updated = await tx.transfer.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes: payload.notes ? `${transfer.notes ? `${transfer.notes} | ` : ""}${payload.notes}` : transfer.notes,
      },
    });

    await audit.record({
      req,
      tx,
      action: "TRANSFER_COMPLETED",
      entityType: "Transfer",
      entityId: id,
      metadata: {
        referenceNumber: transfer.referenceNumber,
        sourceBaseId: transfer.sourceBaseId,
        destinationBaseId: transfer.destinationBaseId,
        equipmentTypeId: transfer.equipmentTypeId,
        quantity: transfer.quantity,
      },
    });

    return updated;
  });

  return prisma.transfer.findUnique({ where: { id: completed.id }, include: LIST_INCLUDE });
}

/**
 * Loads the transfer, confirms the caller may act on the given side, and
 * confirms the current status allows the transition. Every lifecycle endpoint
 * starts here so the rules cannot drift apart between them.
 */
async function requireTransition(id, allowedStatuses, req, authorise) {
  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer) throw ApiError.notFound("Transfer not found");

  if (!canSee(req.user, transfer)) {
    throw ApiError.notFound("Transfer not found");
  }

  if (!authorise(req.user, transfer)) {
    throw ApiError.forbidden("You are not authorised to perform this action on this transfer");
  }

  if (!allowedStatuses.includes(transfer.status)) {
    throw ApiError.conflict(
      `This transfer is ${transfer.status.toLowerCase()} and can no longer be changed`
    );
  }

  return transfer;
}

/** Completed transfer totals per base, used by the dashboard aggregation. */
export async function totals({ baseId, equipmentTypeId, dateFrom, dateTo }) {
  const where = { status: "COMPLETED", equipmentTypeId };
  if (baseId) {
    where.OR = [{ sourceBaseId: baseId }, { destinationBaseId: baseId }];
  }
  if (dateFrom || dateTo) {
    where.completedAt = {};
    if (dateFrom) where.completedAt.gte = dateFrom;
    if (dateTo) where.completedAt.lte = dateTo;
  }

  const [inbound, outbound] = await Promise.all([
    prisma.transfer.aggregate({ where: { ...where, destinationBaseId: baseId ?? undefined }, _sum: { quantity: true } }),
    prisma.transfer.aggregate({ where: { ...where, sourceBaseId: baseId ?? undefined }, _sum: { quantity: true } }),
  ]);

  return {
    transferIn: inbound._sum.quantity ?? 0,
    transferOut: outbound._sum.quantity ?? 0,
  };
}
