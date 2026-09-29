// Rebuild StockBalance from the movement ledger and report any drift.
//
// The cache is written inside the same transaction as each movement, so it
// cannot diverge through the API. This script exists to prove that claim: it
// recomputes every balance from scratch using SQL aggregation over the ledger
// and compares the result against the stored cache.
//
// Usage:
//   node scripts/reconcile-inventory.js          report only
//   node scripts/reconcile-inventory.js --fix    report and correct the cache

import prisma from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

const shouldFix = process.argv.includes("--fix");

// Each rebuild sums the ledger for one base and equipment type. REVERSED rows
// are excluded by the status filter, which is what makes a reversal undo the
// original movement instead of adding to it.
async function rebuildBalances() {
  const purchases = await prisma.$queryRaw`
    SELECT "baseId", "equipmentTypeId", SUM("quantity")::int AS quantity
    FROM "purchases"
    WHERE "status" = 'ACTIVE'
    GROUP BY "baseId", "equipmentTypeId"
  `;

  const expenditures = await prisma.$queryRaw`
    SELECT "baseId", "equipmentTypeId", SUM("quantity")::int AS quantity
    FROM "expenditures"
    WHERE "status" = 'ACTIVE'
    GROUP BY "baseId", "equipmentTypeId"
  `;

  const transferOut = await prisma.$queryRaw`
    SELECT "sourceBaseId" AS "baseId", "equipmentTypeId", SUM("quantity")::int AS quantity
    FROM "transfers"
    WHERE "status" = 'COMPLETED'
    GROUP BY "sourceBaseId", "equipmentTypeId"
  `;

  const transferIn = await prisma.$queryRaw`
    SELECT "destinationBaseId" AS "baseId", "equipmentTypeId", SUM("quantity")::int AS quantity
    FROM "transfers"
    WHERE "status" = 'COMPLETED'
    GROUP BY "destinationBaseId", "equipmentTypeId"
  `;

  const committed = await prisma.$queryRaw`
    SELECT "baseId", "equipmentTypeId", SUM("quantity" - "returnedQuantity")::int AS quantity
    FROM "assignments"
    WHERE "status" IN ('ACTIVE', 'PARTIALLY_RETURNED')
    GROUP BY "baseId", "equipmentTypeId"
  `;

  const accumulator = new Map();
  const key = (baseId, equipmentTypeId) => `${baseId}:${equipmentTypeId}`;

  const add = (rows, field) => {
    for (const row of rows) {
      const mapKey = key(row.baseId, row.equipmentTypeId);
      const current = accumulator.get(mapKey) || { purchases: 0, transferIn: 0, transferOut: 0, expenditures: 0, committed: 0 };
      accumulator.set(mapKey, {
        ...current,
        [field]: current[field] + Number(row.quantity),
      });
    }
  };

  add(purchases, "purchases");
  add(transferIn, "transferIn");
  add(transferOut, "transferOut");
  add(expenditures, "expenditures");
  add(committed, "committed");

  return accumulator;
}

async function main() {
  console.log(`Reconciling against ${env.nodeEnv} database...\n`);

  const expected = await rebuildBalances();
  const stored = await prisma.stockBalance.findMany();

  const drift = [];

  for (const balance of stored) {
    const mapKey = `${balance.baseId}:${balance.equipmentTypeId}`;
    const computed = expected.get(mapKey);

    // The opening baseline has to be included. Movements cannot explain the
    // stock a base held before the system went live, so that starting figure is
    // recorded explicitly and forms part of the expected balance.
    const expectedOnHand =
      balance.openingQuantity +
      (computed?.purchases || 0) +
      (computed?.transferIn || 0) -
      (computed?.transferOut || 0) -
      (computed?.expenditures || 0);
    const expectedCommitted = computed?.committed || 0;

    if (expectedOnHand !== balance.onHandQuantity || expectedCommitted !== balance.committedQuantity) {
      drift.push({
        baseId: balance.baseId,
        equipmentTypeId: balance.equipmentTypeId,
        storedOnHand: balance.onHandQuantity,
        computedOnHand,
        storedCommitted: balance.committedQuantity,
        computedCommitted: expectedCommitted,
      });
    }
  }

  if (drift.length === 0) {
    console.log(`No drift. All ${stored.length} stock balances match the ledger.`);
    console.log("\nThe cache is provably consistent with the movement history.");
    return;
  }

  console.log(`Drift detected on ${drift.length} of ${stored.length} balances:\n`);
  console.table(drift);

  if (!shouldFix) {
    console.log("Re-run with --fix to correct the cache from the ledger.");
    return;
  }

  console.log("\nCorrecting...");
  for (const row of drift) {
    await prisma.stockBalance.update({
      where: {
        stock_balance_base_equipment_key: {
          baseId: row.baseId,
          equipmentTypeId: row.equipmentTypeId,
        },
      },
      data: {
        onHandQuantity: row.computedOnHand,
        committedQuantity: row.computedCommitted,
      },
    });
  }
  console.log(`Corrected ${drift.length} balances.`);
}

main()
  .catch((error) => {
    console.error("Reconciliation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
