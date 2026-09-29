import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

/**
 * Shared fixtures.
 *
 * Ids are looked up by name and email rather than hardcoded, so the suite keeps
 * working after the database is re-seeded and the auto-increment sequence moves
 * on. The seed also generates random quantities, so nothing here may rely on a
 * specific number being present.
 */

// Matches the shared password the seed script gives every demo account.
export const PASSWORD = "Passw0rd@2026";

export const accounts = {
  admin: "admin@mams.local",
  alphaCommander: "commander.alpha@mams.local",
  bravoCommander: "commander.bravo@mams.local",
  alphaLogistics: "logistics.alpha@mams.local",
  charlieLogistics: "logistics.charlie@mams.local",
};

let cache = {};

export async function loadFixtures() {
  if (cache.ready) return cache;

  const [alpha, bravo, charlie] = await Promise.all([
    prisma.base.findUnique({ where: { code: "ALPHA" } }),
    prisma.base.findUnique({ where: { code: "BRAVO" } }),
    prisma.base.findUnique({ where: { code: "CHARLIE" } }),
  ]);

  const [commanderAlpha, commanderBravo, admin] = await Promise.all([
    prisma.user.findUnique({ where: { email: accounts.alphaCommander } }),
    prisma.user.findUnique({ where: { email: accounts.bravoCommander } }),
    prisma.user.findUnique({ where: { email: accounts.admin } }),
  ]);

  // A trackable type is used for stock-sensitive assertions because its
  // quantities are small enough to reason about precisely.
  const rifles = await prisma.equipmentType.findUnique({ where: { code: "ASSAULT_RIFLE" } });

  // Fails loudly with a clear message rather than letting a null fixture turn
  // into a confusing "expected 201, got undefined" much later on.
  for (const [name, value] of Object.entries({ alpha, bravo, charlie, commanderAlpha, commanderBravo, admin, rifles })) {
    if (!value) {
      throw new Error(`Fixture "${name}" is missing. Run \`npm run seed\` before the tests.`);
    }
  }

  cache = {
    ready: true,
    alpha,
    bravo,
    charlie,
    commanderAlpha,
    commanderBravo,
    admin,
    rifles,
  };
  return cache;
}

export async function loginAs(email) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password: PASSWORD });

  assert.equal(response.status, 200, `Expected login to succeed for ${email}`);
  return {
    token: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user,
  };
}

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** Current stock for a base and equipment pair, read straight from the cache. */
export async function stockOf(baseId, equipmentTypeId) {
  const balance = await prisma.stockBalance.findUnique({
    where: { stock_balance_base_equipment_key: { baseId, equipmentTypeId } },
    select: { onHandQuantity: true, committedQuantity: true },
  });
  return {
    onHand: balance?.onHandQuantity ?? 0,
    committed: balance?.committedQuantity ?? 0,
    available: balance ? balance.onHandQuantity - balance.committedQuantity : 0,
  };
}

/**
 * Guarantees a minimum of uncommitted stock before a test that needs room.
 *
 * The suite issues and consumes equipment deliberately, so a test that runs
 * late would otherwise inherit a drained balance from the ones before it.
 * Topping up through the real purchase endpoint keeps the test honest: it
 * exercises the same path a user would.
 */
export async function ensureAvailable(adminToken, baseId, equipmentTypeId, minimum) {
  const before = await stockOf(baseId, equipmentTypeId);
  if (before.available >= minimum) return before;

  const topUp = minimum - before.available + 50;

  const response = await request(app)
    .post("/api/purchases")
    .set(authHeader(adminToken))
    .send({
      baseId,
      equipmentTypeId,
      quantity: topUp,
      purchaseDate: new Date().toISOString(),
      supplier: "Test Replenishment",
    });

  assert.equal(response.status, 201, `top-up purchase failed: ${response.body.message}`);

  return stockOf(baseId, equipmentTypeId);
}

/**
 * Rebuilds every balance from the ledger and compares it with the cache, using
 * the same aggregates the reconciliation script uses.
 *
 * This is the assertion that matters most in the whole suite: it proves the
 * cache still matches history after writes that went through the API, not just
 * after the seed generated its own data.
 */
export async function assertCacheMatchesLedger() {
  const balances = await prisma.stockBalance.findMany();

  for (const balance of balances) {
    const { baseId, equipmentTypeId } = balance;

    const [purchases, expenditures, transferIn, transferOut, committed] = await Promise.all([
      prisma.purchase.aggregate({ where: { baseId, equipmentTypeId, status: "ACTIVE" }, _sum: { quantity: true } }),
      prisma.expenditure.aggregate({ where: { baseId, equipmentTypeId, status: "ACTIVE" }, _sum: { quantity: true } }),
      prisma.transfer.aggregate({ where: { destinationBaseId: baseId, equipmentTypeId, status: "COMPLETED" }, _sum: { quantity: true } }),
      prisma.transfer.aggregate({ where: { sourceBaseId: baseId, equipmentTypeId, status: "COMPLETED" }, _sum: { quantity: true } }),
      prisma.assignment.aggregate({
        where: { baseId, equipmentTypeId, status: { in: ["ACTIVE", "PARTIALLY_RETURNED"] } },
        _sum: { quantity: true, returnedQuantity: true },
      }),
    ]);

    const expectedOnHand =
      balance.openingQuantity +
      (purchases._sum.quantity ?? 0) +
      (transferIn._sum.quantity ?? 0) -
      (transferOut._sum.quantity ?? 0) -
      (expenditures._sum.quantity ?? 0);

    const expectedCommitted = (committed._sum.quantity ?? 0) - (committed._sum.returnedQuantity ?? 0);

    assert.equal(
      balance.onHandQuantity,
      expectedOnHand,
      `on-hand drift for base ${baseId} / equipment ${equipmentTypeId}`
    );
    assert.equal(
      balance.committedQuantity,
      expectedCommitted,
      `committed drift for base ${baseId} / equipment ${equipmentTypeId}`
    );
  }
}

export { prisma, app, request, test, before, after };
