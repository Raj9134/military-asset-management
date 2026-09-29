import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Inventory invariants.
 *
 * Every change to stock in this system goes through applyMovement. Nothing else
 * writes to StockBalance. That single choke point is what keeps the cache
 * consistent with the movement ledger, and it means the "not enough stock"
 * rule is written once instead of four times.
 *
 * Two quantities are tracked, and the difference between them is the whole
 * point of the module:
 *
 *   onHand      physically present at the base
 *   committed   issued to personnel, not yet returned or consumed
 *   available   onHand - committed, the amount that may be newly issued
 *
 * An assignment may only draw on `available`. An expenditure may draw on
 * `onHand`, because writing off stock that is already issued to personnel is
 * legitimate. Collapsing these into one rule is how assets get written off
 * twice.
 */

/**
 * The stock movements this module understands, with the guard each one needs.
 *
 * `available` guard means the row only updates when onHand - committed still
 * covers the quantity. `onHand` and `committed` guards check their own column.
 * A pure increment needs no guard because it can never fail on stock.
 */
export const MOVEMENT = {
  // Purchases and inbound transfers add stock.
  RECEIVE: { onHand: 1, committed: 0, guard: null },

  // Outbound transfers and write-offs remove stock that is physically there.
  RELEASE_ON_HAND: { onHand: -1, committed: 0, guard: "onHand" },

  // Issue to personnel. Takes from available, not from onHand.
  COMMIT: { onHand: 0, committed: 1, guard: "available" },

  // Return from personnel. The equipment never left, so onHand is untouched.
  RELEASE_COMMITTED: { onHand: 0, committed: -1, guard: "committed" },

  // Consumed while issued. Clears both, so the same unit is not subtracted
  // from onHand and then counted again against committed.
  EXPEND_ISSUED: { onHand: -1, committed: -1, guard: "onHand" },
};

const dateOnly = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Reads the current balance, or a zeroed shape when the pair has never been
 * stocked. Returning a well formed object keeps callers from null checking.
 */
export async function getBalance(baseId, equipmentTypeId, client = prisma) {
  const balance = await client.stockBalance.findUnique({
    where: { stock_balance_base_equipment_key: { baseId, equipmentTypeId } },
  });

  if (!balance) {
    return {
      baseId,
      equipmentTypeId,
      openingQuantity: 0,
      onHandQuantity: 0,
      committedQuantity: 0,
      available: 0,
      isTracked: false,
    };
  }

  return {
    ...balance,
    available: balance.onHandQuantity - balance.committedQuantity,
    isTracked: true,
  };
}

/** The quantity that may still be issued to someone. */
export async function getAvailable(baseId, equipmentTypeId, client = prisma) {
  const balance = await getBalance(baseId, equipmentTypeId, client);
  return balance.available;
}

/**
 * Balances for a whole set of pairs, for list screens and the dashboard. One
 * query instead of N, which matters once a dashboard renders twelve cards.
 */
export async function getBalances(baseIds, equipmentTypeId, client = prisma) {
  const balances = await client.stockBalance.findMany({
    where: { equipmentTypeId, baseId: { in: baseIds } },
  });

  const byBase = new Map(balances.map((b) => [b.baseId, b]));

  return baseIds.map((baseId) => {
    const balance = byBase.get(baseId);
    return {
      baseId,
      equipmentTypeId,
      openingQuantity: balance?.openingQuantity ?? 0,
      onHandQuantity: balance?.onHandQuantity ?? 0,
      committedQuantity: balance?.committedQuantity ?? 0,
      available: (balance?.onHandQuantity ?? 0) - (balance?.committedQuantity ?? 0),
      isTracked: Boolean(balance),
    };
  });
}

function insufficient(available, quantity, equipmentName) {
  return ApiError.conflict(
    `Insufficient stock: ${available} available, ${quantity} requested`,
    { available, requested: quantity, equipment: equipmentName }
  );
}

/**
 * Guard for issuing stock to personnel.
 *
 * Checks against available, so equipment already committed elsewhere cannot be
 * promised a second time. `tx` is required rather than optional because every
 * caller runs inside a transaction, and a check made outside one could be
 * invalidated before the write happens.
 */
export async function assertSufficientForIssue(tx, { baseId, equipmentTypeId, quantity }) {
  const balance = await getBalance(baseId, equipmentTypeId, tx);
  if (balance.available < quantity) {
    throw insufficient(balance.available, quantity, null);
  }
  return balance;
}

/**
 * Guard for writing stock off.
 *
 * Checks against onHand rather than available. Stock that is already issued to
 * personnel can still be expended, because the most common real expenditure is
 * a unit issued to a soldier and then consumed in training.
 */
export async function assertSufficientForExpenditure(tx, { baseId, equipmentTypeId, quantity }) {
  const balance = await getBalance(baseId, equipmentTypeId, tx);
  if (balance.onHandQuantity < quantity) {
    throw insufficient(balance.onHandQuantity, quantity, null);
  }
  return balance;
}

/**
 * Applies a stock movement. The only function that writes to StockBalance.
 *
 * The decrement uses a conditional UPDATE with the availability test in the
 * WHERE clause, so Postgres itself decides whether the write happens. That
 * closes the window between checking the balance and writing it, during which
 * two concurrent requests for the last ten rifles would otherwise both see ten
 * and both succeed.
 *
 * This is why the assert functions above are a courtesy rather than the
 * guarantee. They produce a readable error message. This is what actually makes
 * the check safe.
 */
export async function applyMovement(tx, { baseId, equipmentTypeId, quantity, movement }) {
  // Accepts either a rule object (MOVEMENT.RECEIVE) or its name ("RECEIVE").
  // Call sites read better passing the named rule, and accepting both keeps the
  // names usable from configuration or tests.
  const rule = typeof movement === "string" ? MOVEMENT[movement] : movement;

  const isKnownRule =
    rule && typeof rule === "object" && typeof rule.onHand === "number" && typeof rule.committed === "number";

  if (!isKnownRule) {
    throw new Error(`Unknown inventory movement: ${typeof movement === "string" ? movement : JSON.stringify(movement)}`);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest("Quantity must be a positive whole number");
  }

  const onHandDelta = rule.onHand * quantity;
  const committedDelta = rule.committed * quantity;

  if (rule.guard === null) {
    // Adding stock can never fail, so a plain upsert is safe. It also covers
    // the first purchase into a base that has never held this equipment type.
    return tx.stockBalance.upsert({
      where: { stock_balance_base_equipment_key: { baseId, equipmentTypeId } },
      create: {
        baseId,
        equipmentTypeId,
        openingQuantity: 0,
        openingDate: dateOnly(new Date()),
        onHandQuantity: quantity,
        committedQuantity: 0,
      },
      update: {
        onHandQuantity: { increment: quantity },
      },
    });
  }

  // The guard differs per movement, so the predicate is assembled rather than
  // hard coded. Every parameter is bound, never interpolated.
  const guardClause =
    rule.guard === "available"
      ? Prisma.sql`("onHandQuantity" - "committedQuantity") >= ${quantity}`
      : rule.guard === "onHand"
        ? Prisma.sql`"onHandQuantity" >= ${quantity}`
        : Prisma.sql`"committedQuantity" >= ${quantity}`;

  const updated = await tx.$queryRaw`
    UPDATE "stock_balances"
       SET "onHandQuantity"   = "onHandQuantity" + ${onHandDelta},
           "committedQuantity" = "committedQuantity" + ${committedDelta},
           "version"           = "version" + 1,
           "updatedAt"         = NOW()
     WHERE "baseId"          = ${baseId}
       AND "equipmentTypeId" = ${equipmentTypeId}
       AND ${guardClause}
    RETURNING *
  `;

  if (updated.length === 0) {
    // Another request consumed the stock between the assert and this write.
    // The current balance is reported so the caller can see what happened.
    const balance = await getBalance(baseId, equipmentTypeId, tx);
    const remaining = rule.guard === "committed" ? balance.committedQuantity : balance.available;
    throw insufficient(remaining, quantity, null);
  }

  const row = updated[0];
  return { ...row, available: row.onHandQuantity - row.committedQuantity };
}

/**
 * Recomputes one balance from the ledger. Used by the reconciliation script and
 * by tests that need to prove the cache is derivable rather than trusting it.
 */
export async function recomputeFromLedger(tx, baseId, equipmentTypeId) {
  const purchases = await tx.purchase.aggregate({
    where: { baseId, equipmentTypeId, status: "ACTIVE" },
    _sum: { quantity: true },
  });

  const expenditures = await tx.expenditure.aggregate({
    where: { baseId, equipmentTypeId, status: "ACTIVE" },
    _sum: { quantity: true },
  });

  const transferIn = await tx.transfer.aggregate({
    where: { destinationBaseId: baseId, equipmentTypeId, status: "COMPLETED" },
    _sum: { quantity: true },
  });

  const transferOut = await tx.transfer.aggregate({
    where: { sourceBaseId: baseId, equipmentTypeId, status: "COMPLETED" },
    _sum: { quantity: true },
  });

  const opening = await tx.stockBalance.findUnique({
    where: { stock_balance_base_equipment_key: { baseId, equipmentTypeId } },
    select: { openingQuantity: true },
  });

  const committed = await tx.assignment.aggregate({
    where: {
      baseId,
      equipmentTypeId,
      status: { in: ["ACTIVE", "PARTIALLY_RETURNED"] },
    },
    _sum: { quantity: true, returnedQuantity: true },
  });

  const onHand =
    (opening?.openingQuantity ?? 0) +
    (purchases._sum.quantity ?? 0) +
    (transferIn._sum.quantity ?? 0) -
    (transferOut._sum.quantity ?? 0) -
    (expenditures._sum.quantity ?? 0);

  const outstanding =
    (committed._sum.quantity ?? 0) - (committed._sum.returnedQuantity ?? 0);

  return {
    baseId,
    equipmentTypeId,
    openingQuantity: opening?.openingQuantity ?? 0,
    onHandQuantity: onHand,
    committedQuantity: outstanding,
    available: onHand - outstanding,
  };
}
