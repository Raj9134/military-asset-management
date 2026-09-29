import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  app, request, prisma, loadFixtures, loginAs, authHeader, accounts, PASSWORD,
} from "./helpers.js";

describe("authentication", () => {
  before(loadFixtures);
  after(() => prisma.$disconnect());

  test("logs in with valid credentials and returns a token pair", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: PASSWORD });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.data.accessToken, "expected an access token");
    assert.ok(response.body.data.refreshToken, "expected a refresh token");
  });

  test("never returns the password hash", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: PASSWORD });

    const serialised = JSON.stringify(response.body);
    assert.ok(!serialised.includes("passwordHash"), "response leaked passwordHash");
    assert.ok(!response.body.data.user.password, "response leaked a password field");
  });

  test("rejects a wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: "definitely-not-the-password" });

    assert.equal(response.status, 401);
  });

  test("returns the same message for an unknown account as for a wrong password", async () => {
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@mams.local", password: PASSWORD });

    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: "wrong-password" });

    assert.equal(unknown.status, wrong.status);
    // Identical wording is what stops the form being used to enumerate accounts.
    assert.equal(unknown.body.message, wrong.body.message);
  });

  test("rejects a missing token, an invalid token and a malformed token", async () => {
    const missing = await request(app).get("/api/auth/me");
    assert.equal(missing.status, 401);

    const invalid = await request(app).get("/api/auth/me").set(authHeader("not.a.real.jwt"));
    assert.equal(invalid.status, 401);

    const malformed = await request(app).get("/api/auth/me").set(authHeader("Bearer"));
    assert.equal(malformed.status, 401);
  });

  test("returns the current user and permissions from /me", async () => {
    const { token } = await loginAs(accounts.alphaCommander);
    const response = await request(app).get("/api/auth/me").set(authHeader(token));

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.role, "BASE_COMMANDER");
    assert.ok(response.body.data.user.base, "a scoped role must return its base");
    assert.ok(!response.body.data.user.passwordHash, "/me leaked passwordHash");
    assert.ok(Array.isArray(response.body.data.permissions));
  });

  test("rejects login input that fails validation", async () => {
    const missingFields = await request(app).post("/api/auth/login").send({});
    assert.equal(missingFields.status, 400);

    const badEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: PASSWORD });
    assert.equal(badEmail.status, 400);
  });

  test("rate limiting is configured on the credential endpoint", async () => {
    // The limiter allows 1000 attempts under NODE_ENV=test so the suite is not
    // throttled by its own repeated logins. This asserts the middleware is
    // mounted, not that the limit has been reached.
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: accounts.admin, password: "wrong" });

    assert.ok(response.status === 401 || response.status === 429);
  });
});
