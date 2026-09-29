import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  app, request, prisma, loadFixtures, loginAs, authHeader, stockOf, accounts,
} from "./helpers.js";

/**
 * Inventory behaviour through the real HTTP surface.
 *
 * Every assertion compares stock before and after, so the test states the
 * business rule directly: issuing equipment raises committed without touching
 * on hand, and consuming issued equipment lowers both exactly once.
 */

describe("purchase movement", () => {
  let fixtures;
  let admin;
  let logistics;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    logistics = await loginAs(accounts.alphaLogistics);
  });

  after(() => prisma.$disconnect());

  test("a purchase increases on-hand stock by exactly its quantity", async () => {
    const quantity = 25;
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    const response = await request(app)
      .post("/api/purchases")
      .set(authHeader(logistics.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity,
        purchaseDate: new Date().toISOString(),
        supplier: "Test Supplier",
      });

    assert.equal(response.status, 201, response.body.message);
    assert.match(response.body.data.referenceNumber, /^PUR-\d{4}-\d{4}$/);

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(after.onHand, before.onHand + quantity, "on-hand did not increase by the purchase quantity");
    assert.equal(after.committed, before.committed, "a purchase must not touch committed stock");
  });

  test("a purchase writes an audit entry in the same transaction", async () => {
    const response = await request(app)
      .post("/api/purchases")
      .set(authHeader(logistics.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 3,
        purchaseDate: new Date().toISOString(),
      });

    assert.equal(response.status, 201);

    const entry = await prisma.auditLog.findFirst({
      where: { action: "PURCHASE_CREATED", entityType: "Purchase", entityId: String(response.body.data.id) },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(entry, "no audit entry was written for the purchase");
    assert.equal(entry.metadata.quantity, 3);
  });

  test("rejects zero and negative quantities", async () => {
    const zero = await request(app)
      .post("/api/purchases")
      .set(authHeader(logistics.token))
      .send({ baseId: fixtures.alpha.id, equipmentTypeId: fixtures.rifles.id, quantity: 0, purchaseDate: new Date().toISOString() });
    assert.equal(zero.status, 400);

    const negative = await request(app)
      .post("/api/purchases")
      .set(authHeader(logistics.token))
      .send({ baseId: fixtures.alpha.id, equipmentTypeId: fixtures.rifles.id, quantity: -10, purchaseDate: new Date().toISOString() });
    assert.equal(negative.status, 400);
  });

  test("rejects an unknown base and an unknown equipment type", async () => {
    const badBase = await request(app)
      .post("/api/purchases")
      .set(authHeader(admin.token))
      .send({ baseId: 999999, equipmentTypeId: fixtures.rifles.id, quantity: 1, purchaseDate: new Date().toISOString() });
    assert.ok(badBase.status === 400 || badBase.status === 404);

    const badEquipment = await request(app)
      .post("/api/purchases")
      .set(authHeader(admin.token))
      .send({ baseId: fixtures.alpha.id, equipmentTypeId: 999999, quantity: 1, purchaseDate: new Date().toISOString() });
    assert.ok(badEquipment.status === 400 || badEquipment.status === 404);
  });

  test("rejects a purchase into another base for a scoped officer", async () => {
    const response = await request(app)
      .post("/api/purchases")
      .set(authHeader(logistics.token))
      .send({ baseId: fixtures.charlie.id, equipmentTypeId: fixtures.rifles.id, quantity: 1, purchaseDate: new Date().toISOString() });

    assert.equal(response.status, 403);
  });
});

describe("transfer lifecycle", () => {
  let fixtures;
  let admin;
  let alphaCommander;
  let charlieLogistics;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    alphaCommander = await loginAs(accounts.alphaCommander);
    charlieLogistics = await loginAs(accounts.charlieLogistics);
  });

  after(() => prisma.$disconnect());

  const createTransfer = async (quantity = 4) => {
    const response = await request(app)
      .post("/api/transfers")
      .set(authHeader(alphaCommander.token))
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.charlie.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity,
      });
    assert.equal(response.status, 201, response.body.message);
    return response.body.data;
  };

  test("a pending transfer does not move stock", async () => {
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    const transfer = await createTransfer(6);
    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    assert.equal(transfer.status, "PENDING");
    assert.equal(after.onHand, before.onHand, "a pending transfer must not move stock");
  });

  test("refuses a transfer where source and destination are the same base", async () => {
    const response = await request(app)
      .post("/api/transfers")
      .set(authHeader(alphaCommander.token))
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 2,
      });

    assert.equal(response.status, 400);
  });

  test("refuses a transfer with a non-positive quantity", async () => {
    const response = await request(app)
      .post("/api/transfers")
      .set(authHeader(alphaCommander.token))
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.charlie.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 0,
      });

    assert.equal(response.status, 400);
  });

  test("refuses to approve a transfer raised by the same person", async () => {
    const transfer = await createTransfer(3);

    const response = await request(app)
      .post(`/api/transfers/${transfer.id}/approve`)
      .set(authHeader(alphaCommander.token))
      .send({});

    assert.equal(response.status, 403, "four eyes was not enforced");
  });

  test("completing an approved transfer moves stock on both sides exactly once", async () => {
    const quantity = 7;
    const transfer = await createTransfer(quantity);

    // An admin approves so the initiator is not the approver.
    const approved = await request(app)
      .post(`/api/transfers/${transfer.id}/approve`)
      .set(authHeader(admin.token))
      .send({});
    assert.equal(approved.status, 200);
    assert.equal(approved.body.data.status, "APPROVED");

    const sourceBefore = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    const destinationBefore = await stockOf(fixtures.charlie.id, fixtures.rifles.id);

    const completed = await request(app)
      .post(`/api/transfers/${transfer.id}/complete`)
      .set(authHeader(charlieLogistics.token))
      .send({});
    assert.equal(completed.status, 200, completed.body.message);
    assert.equal(completed.body.data.status, "COMPLETED");

    const sourceAfter = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    const destinationAfter = await stockOf(fixtures.charlie.id, fixtures.rifles.id);

    assert.equal(sourceAfter.onHand, sourceBefore.onHand - quantity, "source stock did not decrease by the transfer quantity");
    assert.equal(destinationAfter.onHand, destinationBefore.onHand + quantity, "destination stock did not increase by the transfer quantity");
  });

  test("refuses to complete a transfer that is not approved", async () => {
    const transfer = await createTransfer(2);

    const response = await request(app)
      .post(`/api/transfers/${transfer.id}/complete`)
      .set(authHeader(charlieLogistics.token))
      .send({});

    assert.equal(response.status, 409);
  });

  test("cannot complete the same transfer twice", async () => {
    const transfer = await createTransfer(2);

    await request(app).post(`/api/transfers/${transfer.id}/approve`).set(authHeader(admin.token)).send({});
    const first = await request(app).post(`/api/transfers/${transfer.id}/complete`).set(authHeader(charlieLogistics.token)).send({});
    assert.equal(first.status, 200);

    const second = await request(app).post(`/api/transfers/${transfer.id}/complete`).set(authHeader(charlieLogistics.token)).send({});
    assert.equal(second.status, 409, "a completed transfer was completed a second time");
  });

  test("a cancelled transfer never moves stock", async () => {
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    const transfer = await createTransfer(5);

    const cancelled = await request(app)
      .post(`/api/transfers/${transfer.id}/cancel`)
      .set(authHeader(alphaCommander.token))
      .send({});
    assert.equal(cancelled.status, 200);

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(after.onHand, before.onHand, "a cancelled transfer moved stock");
  });

  test("a rejected transfer never moves stock", async () => {
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    const transfer = await createTransfer(5);

    const rejected = await request(app)
      .post(`/api/transfers/${transfer.id}/reject`)
      .set(authHeader(admin.token))
      .send({ reason: "Destination already holds sufficient stock" });
    assert.equal(rejected.status, 200);

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(after.onHand, before.onHand, "a rejected transfer moved stock");
  });

  test("refuses a transfer that would exceed available stock at the source", async () => {
    const available = (await stockOf(fixtures.alpha.id, fixtures.rifles.id)).available;

    const response = await request(app)
      .post("/api/transfers")
      .set(authHeader(alphaCommander.token))
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.charlie.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: available + 100000,
      });

    // Creation itself may succeed, because the authoritative check happens on
    // completion. Approval then must fail or completion must refuse.
    if (response.status === 201) {
      await request(app).post(`/api/transfers/${response.body.data.id}/approve`).set(authHeader(admin.token)).send({});
      const completed = await request(app)
        .post(`/api/transfers/${response.body.data.id}/complete`)
        .set(authHeader(charlieLogistics.token))
        .send({});

      assert.equal(completed.status, 409, "an over-drawn transfer was completed");
    }
  });

  test("the destination base cannot be completed by an unrelated officer", async () => {
    const transfer = await createTransfer(2);
    await request(app).post(`/api/transfers/${transfer.id}/approve`).set(authHeader(admin.token)).send({});

    const alphaLogistics = await loginAs(accounts.alphaLogistics);
    const response = await request(app)
      .post(`/api/transfers/${transfer.id}/complete`)
      .set(authHeader(alphaLogistics.token))
      .send({});

    assert.equal(response.status, 403, "the sending base completed its own receipt");
  });
});
