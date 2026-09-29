import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  app, request, prisma, loadFixtures, loginAs, authHeader, accounts,
} from "./helpers.js";

/**
 * Resource level authorization.
 *
 * The point of these tests is that a valid token is not sufficient. A base
 * commander holding a perfectly valid JWT must still be refused another base's
 * records, because the restriction is applied as a filter inside the query
 * rather than trusted to the client.
 */

describe("role based access control", () => {
  let fixtures;
  let admin;
  let alphaCommander;
  let alphaLogistics;

  before(async () => {
    fixtures = await loadFixtures();
    admin = await loginAs(accounts.admin);
    alphaCommander = await loginAs(accounts.alphaCommander);
    alphaLogistics = await loginAs(accounts.alphaLogistics);
  });

  after(() => prisma.$disconnect());

  test("a base commander cannot manage users", async () => {
    const response = await request(app).get("/api/users").set(authHeader(alphaCommander.token));
    assert.equal(response.status, 403);
  });

  test("a logistics officer cannot manage users", async () => {
    const response = await request(app).get("/api/users").set(authHeader(alphaLogistics.token));
    assert.equal(response.status, 403);
  });

  test("an admin can list users", async () => {
    const response = await request(app).get("/api/users").set(authHeader(admin.token));
    assert.equal(response.status, 200);
  });

  test("a non-admin cannot create a base", async () => {
    const response = await request(app)
      .post("/api/bases")
      .set(authHeader(alphaCommander.token))
      .send({ code: "DELTA", name: "Delta Base" });

    assert.equal(response.status, 403);
  });

  test("a base commander cannot record a purchase", async () => {
    const response = await request(app)
      .post("/api/purchases")
      .set(authHeader(alphaCommander.token))
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifles.id,
        quantity: 5,
        purchaseDate: new Date().toISOString(),
      });

    assert.equal(response.status, 403);
  });

  test("a logistics officer cannot reverse a purchase", async () => {
    const response = await request(app)
      .post("/api/purchases/1/reverse")
      .set(authHeader(alphaLogistics.token))
      .send({ reason: "not permitted" });

    assert.equal(response.status, 403);
  });

  test("unauthenticated requests are refused everywhere", async () => {
    const routes = [
      "/api/purchases",
      "/api/transfers",
      "/api/assignments",
      "/api/expenditures",
      "/api/dashboard/summary",
      "/api/audit-logs",
      "/api/bases",
      "/api/equipment-types",
      "/api/users",
    ];

    for (const route of routes) {
      const response = await request(app).get(route);
      assert.equal(response.status, 401, `${route} should require authentication`);
    }
  });
});

describe("cross base resource scope", () => {
  let fixtures;
  let alphaCommander;
  let bravoCommander;
  let foreignPurchaseId;

  before(async () => {
    fixtures = await loadFixtures();
    alphaCommander = await loginAs(accounts.alphaCommander);
    bravoCommander = await loginAs(accounts.bravoCommander);

    // An actual Bravo record, so the probe targets something that really exists.
    const bravoPurchase = await prisma.purchase.findFirst({ where: { baseId: fixtures.bravo.id } });
    assert.ok(bravoPurchase, "expected seeded purchase records at Bravo Base");
    foreignPurchaseId = bravoPurchase.id;
  });

  after(() => prisma.$disconnect());

  test("a commander cannot read another base's purchase", async () => {
    const response = await request(app)
      .get(`/api/purchases/${foreignPurchaseId}`)
      .set(authHeader(alphaCommander.token));

    // 404 rather than 403 so the endpoint cannot be used to discover which
    // records exist at other bases by walking ids.
    assert.equal(response.status, 404);
  });

  test("a commander cannot filter a list into another base", async () => {
    const response = await request(app)
      .get(`/api/purchases?baseId=${fixtures.bravo.id}`)
      .set(authHeader(alphaCommander.token));

    assert.equal(response.status, 403);
  });

  test("a commander's purchase list contains only their own base", async () => {
    const response = await request(app)
      .get("/api/purchases?limit=100")
      .set(authHeader(alphaCommander.token));

    assert.equal(response.status, 200);
    assert.ok(response.body.data.data.length > 0, "expected some visible purchases");
    for (const row of response.body.data.data) {
      assert.equal(
        row.baseId,
        fixtures.alpha.id,
        `purchases list leaked a record from base ${row.baseId}`
      );
    }
  });

  test("a commander cannot see another base's transfers", async () => {
    const response = await request(app)
      .get("/api/transfers?limit=100")
      .set(authHeader(alphaCommander.token));

    assert.equal(response.status, 200);
    for (const row of response.body.data.data) {
      const involved = row.sourceBaseId === fixtures.alpha.id || row.destinationBaseId === fixtures.alpha.id;
      assert.ok(involved, `transfers list leaked transfer ${row.referenceNumber}`);
    }
  });

  test("a commander cannot read another base's inventory", async () => {
    const response = await request(app)
      .get(`/api/equipment-types/base/${fixtures.bravo.id}`)
      .set(authHeader(alphaCommander.token));

    assert.equal(response.status, 403);
  });

  test("a commander's dashboard is pinned to their own base", async () => {
    const requested = await request(app)
      .get(`/api/dashboard/summary?baseId=${fixtures.bravo.id}`)
      .set(authHeader(alphaCommander.token));

    // Either the filter is refused, or it is silently ignored and the caller's
    // own base is returned. Both are safe; returning Bravo's figures is not.
    if (requested.status === 200) {
      const ownBase = await request(app)
        .get(`/api/dashboard/summary?baseId=${fixtures.alpha.id}`)
        .set(authHeader(alphaCommander.token));

      assert.deepEqual(
        requested.body.data,
        ownBase.body.data,
        "a base filter for another base changed the figures returned"
      );
    } else {
      assert.equal(requested.status, 403);
    }
  });

  test("a commander cannot read another base's assignments or expenditures", async () => {
    const assignment = await prisma.assignment.findFirst({ where: { baseId: fixtures.bravo.id } });
    const expenditure = await prisma.expenditure.findFirst({ where: { baseId: fixtures.bravo.id } });

    if (assignment) {
      const response = await request(app)
        .get(`/api/assignments/${assignment.id}`)
        .set(authHeader(alphaCommander.token));
      assert.equal(response.status, 404);
    }

    if (expenditure) {
      const response = await request(app)
        .get(`/api/expenditures/${expenditure.id}`)
        .set(authHeader(alphaCommander.token));
      assert.equal(response.status, 404);
    }
  });

  test("an admin is not restricted by base scope", async () => {
    const admin = await loginAs(accounts.admin);

    for (const base of [fixtures.alpha, fixtures.bravo, fixtures.charlie]) {
      const response = await request(app)
        .get(`/api/purchases?baseId=${base.id}&limit=5`)
        .set(authHeader(admin.token));

      assert.equal(response.status, 200, `admin was refused base ${base.code}`);
    }
  });

  test("bravo's commander sees different figures from alpha's", async () => {
    const alpha = await request(app)
      .get("/api/purchases?limit=100")
      .set(authHeader(alphaCommander.token));
    const bravo = await request(app)
      .get("/api/purchases?limit=100")
      .set(authHeader(bravoCommander.token));

    const alphaIds = new Set(alpha.body.data.data.map((row) => row.id));
    const bravoIds = new Set(bravo.body.data.data.map((row) => row.id));

    const overlap = [...alphaIds].filter((id) => bravoIds.has(id));
    assert.equal(overlap.length, 0, "two base commanders can see the same purchase");
  });
});
