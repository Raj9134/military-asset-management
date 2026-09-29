import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  app, request, prisma, loadFixtures, loginAs, authHeader, stockOf, ensureAvailable,
  assertCacheMatchesLedger, accounts,
} from "./helpers.js";

/**
 * The two-quantity model.
 *
 * These are the assertions the whole design rests on. Issuing equipment must not
 * touch on-hand stock, and consuming issued equipment must lower both columns
 * exactly once. Getting that wrong double-counts the same asset, which is the
 * failure the committedQuantity column exists to prevent.
 */

describe("assignments", () => {
  let fixtures;
  let admin;
  let commander;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    commander = await loginAs(accounts.alphaCommander);
  });

  after(() => prisma.$disconnect());

  test("issuing raises committed without changing on-hand", async () => {
    const quantity = 8;
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    const response = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity,
        personnelName: "Test Personnel",
        personnelId: "SV-9999",
        assignmentDate: new Date().toISOString(),
      });

    assert.equal(response.status, 201, response.body.message);
    assert.equal(response.body.data.quantity, quantity);
    assert.equal(response.body.data.returnedQuantity, 0);
    assert.equal(response.body.data.status, "ACTIVE");

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    assert.equal(after.onHand, before.onHand, "issuing must not reduce on-hand stock");
    assert.equal(after.committed, before.committed + quantity, "committed did not rise by the issued quantity");
    assert.equal(after.available, before.available - quantity, "available did not fall by the issued quantity");
  });

  test("refuses to issue more than is available", async () => {
    const available = (await stockOf(fixtures.alpha.id, fixtures.rifles.id)).available;

    const response = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: available + 50000,
        personnelName: "Greedy Test",
        assignmentDate: new Date().toISOString(),
      });

    assert.equal(response.status, 409, "an over-issue was accepted");
  });

  test("refuses an assignment with neither an asset nor an equipment type", async () => {
    const response = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        personnelName: "No Target",
        quantity: 1,
        assignmentDate: new Date().toISOString(),
      });

    assert.equal(response.status, 400);
  });

  test("returning equipment releases committed without touching on-hand", async () => {
    const quantity = 5;
    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity,
        personnelName: "Return Test",
        assignmentDate: new Date().toISOString(),
      });
    assert.equal(issued.status, 201);

    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    const returned = await request(app)
      .post(`/api/assignments/${issued.body.data.id}/return`)
      .set(authHeader(commander.token))
      .send({ returnedQuantity: quantity });
    assert.equal(returned.status, 200);
    assert.equal(returned.body.data.status, "RETURNED");

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    assert.equal(after.committed, before.committed - quantity, "committed was not released");
    assert.equal(after.onHand, before.onHand, "a return must not change on-hand: the equipment never left");
  });

  test("a partial return leaves the assignment partly outstanding", async () => {
    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 10,
        personnelName: "Partial Return Test",
        assignmentDate: new Date().toISOString(),
      });
    assert.equal(issued.status, 201);

    const response = await request(app)
      .post(`/api/assignments/${issued.body.data.id}/return`)
      .set(authHeader(commander.token))
      .send({ returnedQuantity: 4 });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "PARTIALLY_RETURNED");
    assert.equal(response.body.data.returnedQuantity, 4);
  });

  test("refuses to return more than was issued", async () => {
    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 3,
        personnelName: "Over Return Test",
        assignmentDate: new Date().toISOString(),
      });

    const response = await request(app)
      .post(`/api/assignments/${issued.body.data.id}/return`)
      .set(authHeader(commander.token))
      .send({ returnedQuantity: 99 });

    assert.equal(response.status, 400);
  });

  void admin;
});

describe("expenditures", () => {
  let fixtures;
  let commander;
  let admin;

  before(async () => {
    fixtures = await loadFixtures();
    commander = await loginAs(accounts.alphaCommander);
    admin = await loginAs(accounts.admin);
    // Earlier tests deliberately issue equipment away, so guarantee headroom
    // before this suite starts drawing on the same balance.
    await ensureAvailable(admin.token, fixtures.alpha.id, fixtures.rifles.id, 200);
  });

  after(() => prisma.$disconnect());

  test("an unassigned expenditure lowers on-hand only", async () => {
    const quantity = 6;
    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    const response = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity,
        expenditureDate: new Date().toISOString(),
        reason: "DAMAGE",
        notes: "Barrel heat damage beyond service limit",
      });

    assert.equal(response.status, 201, response.body.message);

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(after.onHand, before.onHand - quantity, "on-hand did not fall by the written-off quantity");
    assert.equal(after.committed, before.committed, "an unassigned expenditure must not touch committed");
  });

  test("consuming issued equipment lowers on-hand and committed exactly once", async () => {
    const issueQuantity = 12;
    const consumeQuantity = 5;

    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: issueQuantity,
        personnelName: "Training Candidate",
        assignmentDate: new Date().toISOString(),
      });
    assert.equal(issued.status, 201);

    const before = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    const expenditure = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: consumeQuantity,
        expenditureDate: new Date().toISOString(),
        reason: "TRAINING",
        assignmentId: issued.body.data.id,
      });

    assert.equal(expenditure.status, 201, expenditure.body.message);

    const after = await stockOf(fixtures.alpha.id, fixtures.rifles.id);

    assert.equal(
      after.onHand,
      before.onHand - consumeQuantity,
      "on-hand did not fall exactly once by the consumed quantity"
    );
    assert.equal(
      after.committed,
      before.committed - consumeQuantity,
      "committed was not released with the consumption, so the same asset is counted twice"
    );
  });

  test("an unlinked write-off is refused once the stock is already issued", async () => {
    // The committed <= on-hand invariant means an unlinked write-off can only
    // draw on available stock. Writing off issued equipment is legal, but only
    // when the expenditure names the assignment it came from, because that
    // clears committed in the same movement.
    const balance = await ensureAvailable(admin.token, fixtures.alpha.id, fixtures.rifles.id, 50);
    assert.ok(balance.available >= 50, "expected headroom before committing everything");

    const onHandBefore = balance.onHand;

    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: balance.available,
        personnelName: "Everything Test",
        assignmentDate: new Date().toISOString(),
      });
    assert.equal(issued.status, 201, issued.body.message);

    const committed = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(committed.available, 0, "all available stock should now be issued");
    assert.equal(committed.onHand, onHandBefore, "issuing must not change on-hand");

    const writeOff = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 2,
        expenditureDate: new Date().toISOString(),
        reason: "TRAINING",
      });

    assert.equal(writeOff.status, 409, "an unlinked write-off should be refused, not fail with a server error");
    assert.match(writeOff.body.message, /issued to personnel/i);

    // Consuming the same units *through* the assignment must succeed, because
    // that path releases committed at the same time.
    const linked = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 2,
        expenditureDate: new Date().toISOString(),
        reason: "TRAINING",
        assignmentId: issued.body.data.id,
      });
    assert.equal(linked.status, 201, linked.body.message);

    const final = await stockOf(fixtures.alpha.id, fixtures.rifles.id);
    assert.equal(final.onHand, onHandBefore - 2, "the linked write-off should lower on-hand by 2");
    assert.equal(final.committed, committed.committed - 2, "the linked write-off should also release committed");

    // Leave headroom for whatever runs next.
    await ensureAvailable(admin.token, fixtures.alpha.id, fixtures.rifles.id, 60);
  });

  test("refuses an expenditure larger than stock on hand", async () => {
    const response = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 9999999,
        expenditureDate: new Date().toISOString(),
        reason: "LOSS",
      });

    assert.equal(response.status, 409);
  });

  test("refuses an assignment link from a different base or equipment type", async () => {
    await ensureAvailable(admin.token, fixtures.alpha.id, fixtures.rifles.id, 20);

    const issued = await request(app)
      .post("/api/assignments")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 2,
        personnelName: "Cross Check Test",
        assignmentDate: new Date().toISOString(),
      });
    assert.equal(issued.status, 201);

    const ammo = await prisma.equipmentType.findUnique({ where: { code: "AMMO_556" } });

    const wrongEquipment = await request(app)
      .post("/api/expenditures")
      .set(authHeader(commander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: ammo.id,
        quantity: 1,
        expenditureDate: new Date().toISOString(),
        reason: "OTHER",
        assignmentId: issued.body.data.id,
      });

    assert.equal(wrongEquipment.status, 400, "an assignment was linked to different equipment");
  });

  test("a logistics officer cannot record an expenditure", async () => {
    const logistics = await loginAs(accounts.alphaLogistics);
    const response = await request(app)
      .post("/api/expenditures")
      .set(authHeader(logistics.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 1,
        expenditureDate: new Date().toISOString(),
        reason: "OTHER",
      });

    assert.equal(response.status, 403);
  });
});

describe("integrity after API mutations", () => {
  before(async () => {
    await loadFixtures();
    await loginAs(accounts.admin);
  });

  after(() => prisma.$disconnect());

  test("the stock cache still matches the ledger after all of the above", async () => {
    // The seed proves the cache agrees with generated history. This proves it
    // still agrees after writes that arrived through the API inside real
    // transactions, which is the property the design depends on.
    await assertCacheMatchesLedger();
  });

  test("no stock balance is negative and none is over-committed", async () => {
    const balances = await prisma.stockBalance.findMany();

    for (const balance of balances) {
      assert.ok(balance.onHandQuantity >= 0, `negative on-hand at base ${balance.baseId}`);
      assert.ok(balance.committedQuantity >= 0, `negative committed at base ${balance.baseId}`);
      assert.ok(
        balance.committedQuantity <= balance.onHandQuantity,
        `committed exceeds on-hand at base ${balance.baseId}`
      );
    }
  });
});
