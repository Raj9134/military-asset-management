import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { app, request, prisma, loadFixtures, loginAs, authHeader, accounts } from "./helpers.js";

// A cross-origin refusal is a CORS decision, not a server fault. These tests
// pin that distinction down, because getting it wrong is invisible locally: it
// only shows up once a browser on a different origin calls the API, at which
// point every request fails with an opaque message and no way to tell whether
// the API is down, misconfigured or refusing the caller.
//
// The regression that motivated this file: a rejected origin was reported by
// calling back with an Error, which Express passed to the generic error handler.
// Every cross-origin request answered 500 INTERNAL_ERROR, including the health
// endpoint, so a correctly working deployment looked broken.
describe("CORS", () => {
  before(loadFixtures);
  after(() => prisma.$disconnect());

  test("answers a request carrying no Origin header", async () => {
    // curl, Postman and Render's own health check all omit Origin.
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "ok");
  });

  test("echoes Access-Control-Allow-Origin for an allowed origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    assert.equal(response.status, 200);
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173",
      "expected the allowed origin to be echoed back"
    );
  });

  test("does not answer 500 when the origin is not allowed", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://attacker.example.com");

    assert.notEqual(
      response.status,
      500,
      "a refused origin must not be reported as an internal server error"
    );
    assert.ok(
      !response.body.error || response.body.error !== "INTERNAL_ERROR",
      `expected a CORS refusal, received ${JSON.stringify(response.body)}`
    );
  });

  test("omits Access-Control-Allow-Origin for a disallowed origin", async () => {
    // This is the control that actually protects the response. The browser
    // refuses to hand the body to the calling page when the header is absent,
    // so the request itself may still succeed -- what must not happen is the
    // header being present, which would let any site read the response.
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://attacker.example.com");

    assert.equal(
      response.headers["access-control-allow-origin"],
      undefined,
      "a disallowed origin must not be granted read access to the response"
    );
  });

  test("answers the browser preflight for a write from an allowed origin", async () => {
    // Without this the browser sends an OPTIONS probe that Express 404s, and
    // reports a CORS failure even though the origin is perfectly acceptable.
    const response = await request(app)
      .options("/api/purchases/")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,authorization");

    assert.ok(
      response.status === 204 || response.status === 200,
      `expected the preflight to be answered, received ${response.status}`
    );
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173"
    );
    assert.match(
      response.headers["access-control-allow-methods"] || "",
      /POST/,
      "expected POST to be advertised in Access-Control-Allow-Methods"
    );
  });

  test("still authenticates and authorises normally under CORS", async () => {
    // Guards against a fix that "resolves" the problem by allowing everything.
    const login = await loginAs(accounts.alphaCommander);
    const response = await request(app)
      .get("/api/users")
      .set("Origin", "http://localhost:5173")
      .set(authHeader(login.token));

    assert.equal(response.status, 403, "a commander must still be refused /api/users");
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173",
      "an allowed origin should still be granted read access"
    );
  });
});
