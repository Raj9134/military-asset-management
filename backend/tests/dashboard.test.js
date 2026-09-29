import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  app, request, prisma, loadFixtures, loginAs, authHeader, accounts,
} from "./helpers.js";

describe("dashboard aggregation", () => {
  let fixtures;
  let admin;
  let commander;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    commander = await loginAs(accounts.alphaCommander);
  });

  after(() => prisma.$disconnect());

  test("returns every headline figure", async () => {
    const response = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    assert.equal(response.status, 200);

    const data = response.body.data;
    for (const key of [
      "openingBalance", "purchases", "transferIn", "transferOut",
      "expended", "assigned", "netMovement", "closingBalance", "available",
    ]) {
      assert.ok(key in data, `summary is missing ${key}`);
    }
  });

  test("net movement equals purchases plus transfer in minus transfer out", async () => {
    const response = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    const { purchases, transferIn, transferOut, netMovement } = response.body.data;
    assert.equal(netMovement, purchases + transferIn - transferOut);
  });

  test("closing balance equals opening plus net movement minus expenditure", async () => {
    const response = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    const { openingBalance, purchases, transferIn, transferOut, expended, closingBalance } = response.body.data;
    const expected = openingBalance + purchases + transferIn - transferOut - expended;

    assert.equal(
      closingBalance,
      expected,
      "closing balance does not follow opening + purchases + transfer in - transfer out - expenditure"
    );
  });

  test("available equals closing balance minus committed stock", async () => {
    const response = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    const { closingBalance, committedQuantity, available } = response.body.data;
    assert.equal(available, closingBalance - committedQuantity);
  });

  test("the summary agrees with the per-equipment movement rows", async () => {
    const summary = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));
    const movements = await request(app)
      .get(`/api/dashboard/movements?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    const row = movements.body.data.find((item) => item.equipmentType.id === fixtures.rifles.id);
    assert.ok(row, "expected a movement row for the rifles");

    assert.equal(row.closingBalance, summary.body.data.closingBalance, "closing balance disagrees between endpoints");
    assert.equal(row.available, summary.body.data.available, "available disagrees between endpoints");
    assert.equal(row.purchases, summary.body.data.purchases, "purchases disagree between endpoints");
  });

  test("closing balance is withheld rather than invented when a date range is given", async () => {
    const response = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&dateFrom=2000-01-01`)
      .set(authHeader(admin.token));

    assert.equal(response.status, 200);
    assert.equal(
      response.body.data.closingBalance,
      null,
      "a historical closing balance cannot be derived from movement totals and must not be guessed"
    );
    assert.equal(response.body.data.filteredByDate, true);
  });

  test("the opening balance is not affected by the date filter", async () => {
    // Applying the range to the opening figure would silently break the closing
    // equation, which is the classic bug in hand-rolled balance reports.
    const unfiltered = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));
    const filtered = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}&dateFrom=2000-01-01`)
      .set(authHeader(admin.token));

    assert.equal(
      filtered.body.data.openingBalance,
      unfiltered.body.data.openingBalance,
      "the opening baseline was filtered by date"
    );
  });

  test("net movement details explain the net movement figure", async () => {
    const response = await request(app)
      .get(`/api/dashboard/net-movement-details?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.data.rows));

    for (const row of response.body.data.rows) {
      assert.ok(row.reference, "each movement row needs a reference number");
      assert.ok(row.equipmentType, "each movement row needs its equipment type");
      assert.ok(row.date, "each movement row needs a date");
      assert.ok(["IN", "OUT"].includes(row.effect));

      if (row.movementType === "TRANSFER") {
        assert.ok(row.sourceBase, "a transfer row needs its source base");
        assert.ok(row.destinationBase, "a transfer row needs its destination base");
      }
    }

    // The detail rows must reconstruct the figure shown on the dashboard.
    const fromRows = response.body.data.rows.reduce(
      (sum, row) => sum + (row.effect === "IN" ? row.quantity : -row.quantity),
      0
    );
    assert.equal(response.body.data.netMovement, fromRows);
  });

  test("filters constrain the movement rows", async () => {
    const response = await request(app)
      .get(`/api/dashboard/movements?baseId=${fixtures.alpha.id}&equipmentTypeId=${fixtures.rifles.id}`)
      .set(authHeader(admin.token));

    assert.equal(response.body.data.length, 1, "expected exactly one row for a single equipment type");
  });

  test("filter options only offer bases the caller may use", async () => {
    const adminOptions = await request(app).get("/api/dashboard/filters").set(authHeader(admin.token));
    assert.equal(adminOptions.status, 200);
    assert.ok(adminOptions.body.data.bases.length >= 3, "an admin should see every base");

    const commanderOptions = await request(app).get("/api/dashboard/filters").set(authHeader(commander.token));
    assert.equal(commanderOptions.status, 200);
    assert.equal(
      commanderOptions.body.data.bases.length,
      1,
      "a base commander was offered other bases to filter by"
    );
    assert.equal(commanderOptions.body.data.bases[0].id, fixtures.alpha.id);
  });

  test("rejects an inverted date range", async () => {
    const response = await request(app)
      .get("/api/dashboard/summary?dateFrom=2026-06-01&dateTo=2026-01-01")
      .set(authHeader(admin.token));

    assert.equal(response.status, 400);
  });

  void fixtures;
});

describe("pagination", () => {
  let admin;

  before(async () => {
    await loadFixtures();
    admin = await loginAs(accounts.admin);
  });

  after(() => prisma.$disconnect());

  test("returns the expected pagination envelope", async () => {
    const response = await request(app)
      .get("/api/purchases?page=1&limit=5")
      .set(authHeader(admin.token));

    assert.equal(response.status, 200);
    const { page, limit, total, totalPages, data } = response.body.data;

    assert.equal(page, 1);
    assert.equal(limit, 5);
    assert.ok(total > 0, "expected seeded purchases");
    assert.equal(totalPages, Math.ceil(total / limit));
    assert.equal(data.length, 5);
  });

  test("a later page returns different records", async () => {
    const first = await request(app).get("/api/purchases?page=1&limit=5").set(authHeader(admin.token));
    const second = await request(app).get("/api/purchases?page=2&limit=5").set(authHeader(admin.token));

    const firstIds = first.body.data.data.map((row) => row.id);
    const secondIds = second.body.data.data.map((row) => row.id);
    const overlap = firstIds.filter((id) => secondIds.includes(id));

    assert.equal(overlap.length, 0, "pagination returned the same rows twice");
  });

  test("caps the page size so a client cannot request the whole table", async () => {
    const response = await request(app)
      .get("/api/purchases?limit=100000")
      .set(authHeader(admin.token));

    assert.equal(response.status, 400);
  });
});

describe("audit logging", () => {
  let fixtures;
  let admin;
  let commander;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    commander = await loginAs(accounts.alphaCommander);
  });

  after(() => prisma.$disconnect());

  test("records a successful login", async () => {
    await loginAs(accounts.alphaCommander);

    const entry = await prisma.auditLog.findFirst({
      where: { action: "LOGIN", userEmail: accounts.alphaCommander },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(entry, "no LOGIN audit entry was written");
    assert.ok(entry.requestId, "an audit entry needs a request id");
    assert.ok(entry.method && entry.endpoint, "an audit entry needs the request that caused it");
  });

  test("records a failed login without the password", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: "wrong-password-for-audit-test" });

    const entry = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_FAILED" },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(entry, "no LOGIN_FAILED audit entry was written");
    assert.equal(entry.userEmail, accounts.admin);

    const serialised = JSON.stringify(entry);
    assert.ok(!serialised.includes("wrong-password-for-audit-test"), "the audit log stored a password");
  });

  test("captures the address the request came from", async () => {
    await loginAs(accounts.admin);

    const entry = await prisma.auditLog.findFirst({
      where: { action: "LOGIN" },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(entry.ipAddress, "an audit entry should record the caller address");
  });

  test("never stores a password hash in any audit metadata", async () => {
    const entries = await prisma.auditLog.findMany({ take: 100 });
    const serialised = JSON.stringify(entries);

    assert.ok(!serialised.includes("passwordHash"), "audit metadata contains a passwordHash");
    assert.ok(!/\$2[aby]\$/.test(serialised), "audit metadata contains something that looks like a bcrypt hash");
  });

  test("an admin can read the full audit log", async () => {
    const response = await request(app).get("/api/audit-logs?limit=10").set(authHeader(admin.token));
    assert.equal(response.status, 200);
    assert.ok(response.body.data.total > 0);
  });

  test("a base commander's audit view does not include another base's records", async () => {
    const response = await request(app).get("/api/audit-logs?limit=100").set(authHeader(commander.token));
    assert.equal(response.status, 200);

    const bravoIds = new Set(
      (await prisma.purchase.findMany({ where: { baseId: fixtures.bravo.id }, select: { id: true } }))
        .map((row) => String(row.id))
    );

    for (const entry of response.body.data.data) {
      if (entry.entityType === "Purchase" && entry.entityId) {
        assert.ok(
          !bravoIds.has(String(entry.entityId)),
          `audit log exposed a Bravo Base purchase (#${entry.entityId}) to Alpha's commander`
        );
      }
    }
  });

  test("audit filters work", async () => {
    const response = await request(app)
      .get("/api/audit-logs?action=PURCHASE_CREATED&limit=5")
      .set(authHeader(admin.token));

    assert.equal(response.status, 200);
    for (const entry of response.body.data.data) {
      assert.equal(entry.action, "PURCHASE_CREATED");
    }
  });
});
