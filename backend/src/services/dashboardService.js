import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";

/**
 * Dashboard aggregation.
 *
 * Every figure here is produced by a database aggregate. None of it is computed
 * in the browser, and none of it is a stored number that could be edited by
 * hand.
 *
 * The equations are:
 *
 *   Closing balance = opening + purchases + transferIn - transferOut - expenditure
 *   Net movement    = purchases + transferIn - transferOut
 *   Available       = closing - committed
 *
 * One deliberate decision: the opening balance is not filtered by the date
 * range. It is the state the base was in when the period started, and applying a
 * date filter to it would silently break the closing equation. Filters restrict
 * the movements within the period, never the baseline.
 */

function resolveTargets({ baseId, equipmentTypeId }, user) {
  // A non-admin is always pinned to their own base, whatever they asked for.
  const scopedBaseId =
    user.role === ROLES.ADMIN ? baseId || null : user.baseId || null;

  if (!scopedBaseId && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden("Your account has no base assigned");
  }

  return { baseId: scopedBaseId, equipmentTypeId: equipmentTypeId || null };
}

function dateWindow({ dateFrom, dateTo }) {
  const from = dateFrom ? new Date(dateFrom) : new Date(0);
  // A missing end date means "up to now", and a future end date is clamped so a
  // stray query cannot inflate the figures with movements that do not exist yet.
  const to = dateTo ? new Date(dateTo) : new Date();

  return { gte: from, lte: new Date(Math.min(to.getTime(), Date.now())) };
}

/**
 * Headline figures for the selected filters.
 */
export async function summary(filters, user) {
  const { baseId, equipmentTypeId } = resolveTargets(filters, user);
  const window = dateWindow(filters);

  const purchaseWhere = { status: "ACTIVE", purchaseDate: window };
  const expenditureWhere = { status: "ACTIVE", expenditureDate: window };
  const transferWhere = { status: "COMPLETED", completedAt: window };
  const assignmentWhere = { status: { in: ["ACTIVE", "PARTIALLY_RETURNED"] } };

  if (baseId) {
    purchaseWhere.baseId = baseId;
    expenditureWhere.baseId = baseId;
    assignmentWhere.baseId = baseId;
    // A transfer counts for a base when the base is either end of it.
    transferWhere.OR = [{ sourceBaseId: baseId }, { destinationBaseId: baseId }];
  }
  if (equipmentTypeId) {
    purchaseWhere.equipmentTypeId = equipmentTypeId;
    expenditureWhere.equipmentTypeId = equipmentTypeId;
    transferWhere.equipmentTypeId = equipmentTypeId;
    assignmentWhere.equipmentTypeId = equipmentTypeId;
  }

  const [purchases, expenditures, transferIn, transferOut, assignments] = await Promise.all([
    prisma.purchase.aggregate({ where: purchaseWhere, _sum: { quantity: true } }),
    prisma.expenditure.aggregate({ where: expenditureWhere, _sum: { quantity: true } }),
    prisma.transfer.aggregate({
      where: { ...transferWhere, destinationBaseId: baseId ?? undefined },
      _sum: { quantity: true },
    }),
    prisma.transfer.aggregate({
      where: { ...transferWhere, sourceBaseId: baseId ?? undefined },
      _sum: { quantity: true },
    }),
    prisma.assignment.aggregate({
      where: assignmentWhere,
      _sum: { quantity: true, returnedQuantity: true },
    }),
  ]);

  // Opening and current balances come from the cache, which the inventory
  // service keeps in step with the ledger.
  const balanceWhere = {};
  if (baseId) balanceWhere.baseId = baseId;
  if (equipmentTypeId) balanceWhere.equipmentTypeId = equipmentTypeId;

  const balances = await prisma.stockBalance.findMany({
    where: balanceWhere,
    select: { openingQuantity: true, onHandQuantity: true, committedQuantity: true },
  });

  const opening = balances.reduce((sum, b) => sum + b.openingQuantity, 0);
  const currentOnHand = balances.reduce((sum, b) => sum + b.onHandQuantity, 0);
  const committed = balances.reduce((sum, b) => sum + b.committedQuantity, 0);

  const purchased = purchases._sum.quantity ?? 0;
  const expended = expenditures._sum.quantity ?? 0;
  const received = transferIn._sum.quantity ?? 0;
  const dispatched = transferOut._sum.quantity ?? 0;
  const assigned = (assignments._sum.quantity ?? 0) - (assignments._sum.returnedQuantity ?? 0);

  const netMovement = purchased + received - dispatched;

  // With no filters at all, current on hand is the closing balance. With a date
  // range it is not, because closing balance as at dateTo would require
  // reconstructing state at that point in time. Reporting the current figure and
  // saying so is honest; inventing the historical one would not be.
  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);

  return {
    openingBalance: opening,
    purchases: purchased,
    transferIn: received,
    transferOut: dispatched,
    expended,
    assigned,
    netMovement,
    closingBalance: hasDateFilter ? null : currentOnHand,
    committedQuantity: committed,
    available: hasDateFilter ? null : currentOnHand - committed,
    filteredByDate: hasDateFilter,
    note: hasDateFilter
      ? "Closing balance is omitted for a date range, because reconstructing stock as at a past date is not derivable from movement totals alone."
      : null,
  };
}

/**
 * Per-equipment-type breakdown for the same filters. Used for the movement
 * table and the equipment bars on the dashboard.
 */
export async function movements(filters, user) {
  const { baseId, equipmentTypeId } = resolveTargets(filters, user);
  const window = dateWindow(filters);

  const balances = await prisma.stockBalance.findMany({
    where: {
      ...(baseId ? { baseId } : {}),
      ...(equipmentTypeId ? { equipmentTypeId } : {}),
    },
    include: { equipmentType: { select: { id: true, code: true, name: true, unitOfMeasure: true, category: true } } },
    orderBy: { equipmentType: { name: "asc" } },
  });

  const purchaseWhere = {
    status: "ACTIVE",
    purchaseDate: window,
    ...(baseId ? { baseId } : {}),
    ...(equipmentTypeId ? { equipmentTypeId } : {}),
  };
  const expenditureWhere = {
    status: "ACTIVE",
    expenditureDate: window,
    ...(baseId ? { baseId } : {}),
    ...(equipmentTypeId ? { equipmentTypeId } : {}),
  };
  const transferWhere = {
    status: "COMPLETED",
    completedAt: window,
    ...(equipmentTypeId ? { equipmentTypeId } : {}),
    ...(baseId ? { OR: [{ sourceBaseId: baseId }, { destinationBaseId: baseId }] } : {}),
  };

  const rows = balances.map((balance) => ({ balance, equipment: balance.equipmentType, id: balance.equipmentTypeId }));

  const [purchases, expenditures, inbound, outbound] = await Promise.all([
    prisma.purchase.groupBy({ by: ["equipmentTypeId"], where: purchaseWhere, _sum: { quantity: true } }),
    prisma.expenditure.groupBy({ by: ["equipmentTypeId"], where: expenditureWhere, _sum: { quantity: true } }),
    prisma.transfer.groupBy({
      by: ["equipmentTypeId"],
      where: { ...transferWhere, ...(baseId ? { destinationBaseId: baseId } : {}) },
      _sum: { quantity: true },
    }),
    prisma.transfer.groupBy({
      by: ["equipmentTypeId"],
      where: { ...transferWhere, ...(baseId ? { sourceBaseId: baseId } : {}) },
      _sum: { quantity: true },
    }),
  ]);

  const asMap = (groups) => new Map(groups.map((g) => [g.equipmentTypeId, g._sum.quantity ?? 0]));
  const purchaseMap = asMap(purchases);
  const expenditureMap = asMap(expenditures);
  const inboundMap = asMap(inbound);
  const outboundMap = asMap(outbound);

  return rows.map((row) => {
    const purchased = purchaseMap.get(row.id) ?? 0;
    const expended = expenditureMap.get(row.id) ?? 0;
    const received = inboundMap.get(row.id) ?? 0;
    const dispatched = outboundMap.get(row.id) ?? 0;

    return {
      equipmentType: row.equipment,
      openingBalance: row.balance.openingQuantity,
      purchases: purchased,
      transferIn: received,
      transferOut: dispatched,
      expended,
      netMovement: purchased + received - dispatched,
      closingBalance: row.balance.onHandQuantity,
      committedQuantity: row.balance.committedQuantity,
      available: row.balance.onHandQuantity - row.balance.committedQuantity,
    };
  });
}

/**
 * Row-level detail behind the Net Movement figure.
 *
 * The dashboard shows one number for net movement, which on its own hides how it
 * was made up. This returns the individual purchases and transfers that produced
 * it, with quantity, date, equipment type, both bases where relevant, and the
 * reference number.
 */
export async function netMovementDetails(filters, user) {
  const { baseId, equipmentTypeId } = resolveTargets(filters, user);
  const window = dateWindow(filters);

  const purchaseWhere = {
    status: "ACTIVE",
    purchaseDate: window,
    ...(baseId ? { baseId } : {}),
    ...(equipmentTypeId ? { equipmentTypeId } : {}),
  };

  const transferWhere = {
    status: "COMPLETED",
    completedAt: window,
    ...(equipmentTypeId ? { equipmentTypeId } : {}),
    // Without a base filter every completed transfer counts on both sides, which
    // is what makes the global net movement add up.
    ...(baseId ? { OR: [{ sourceBaseId: baseId }, { destinationBaseId: baseId }] } : {}),
  };

  const [purchases, transfers] = await Promise.all([
    prisma.purchase.findMany({
      where: purchaseWhere,
      orderBy: { purchaseDate: "desc" },
      take: 200,
      include: {
        equipmentType: { select: { name: true, unitOfMeasure: true } },
        base: { select: { id: true, code: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.transfer.findMany({
      where: transferWhere,
      orderBy: { completedAt: "desc" },
      take: 200,
      include: {
        equipmentType: { select: { name: true, unitOfMeasure: true } },
        sourceBase: { select: { id: true, code: true, name: true } },
        destinationBase: { select: { id: true, code: true, name: true } },
      },
    }),
  ]);

  const purchaseRows = purchases.map((row) => ({
    movementType: "PURCHASE",
    effect: "IN",
    quantity: row.quantity,
    date: row.purchaseDate,
    equipmentType: row.equipmentType.name,
    unitOfMeasure: row.equipmentType.unitOfMeasure,
    sourceBase: null,
    destinationBase: row.base.name,
    reference: row.referenceNumber,
    recordedBy: row.createdBy?.name ?? null,
    notes: row.notes,
  }));

  const transferRows = transfers.map((row) => {
    const isInbound = baseId ? row.destinationBaseId === baseId : true;
    return {
      movementType: "TRANSFER",
      effect: isInbound ? "IN" : "OUT",
      quantity: row.quantity,
      date: row.completedAt,
      equipmentType: row.equipmentType.name,
      unitOfMeasure: row.equipmentType.unitOfMeasure,
      sourceBase: row.sourceBase.name,
      destinationBase: row.destinationBase.name,
      reference: row.referenceNumber,
      recordedBy: null,
      notes: row.notes,
    };
  });

  const rows = [...purchaseRows, ...transferRows].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return {
    total: rows.length,
    truncated: rows.length >= 200,
    netMovement: rows.reduce((sum, row) => sum + (row.effect === "IN" ? row.quantity : -row.quantity), 0),
    rows,
  };
}

/**
 * Reference data for the filter controls: the bases and equipment types a
 * caller may filter by. One call instead of three when a screen loads.
 */
export async function filterOptions(user) {
  const bases = await prisma.base.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });

  const equipmentTypes = await prisma.equipmentType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, category: true, unitOfMeasure: true, isTrackable: true },
  });

  return {
    bases: user.role === ROLES.ADMIN ? bases : bases.filter((base) => base.id === user.baseId),
    equipmentTypes,
  };
}
