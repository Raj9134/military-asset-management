# Project Documentation (PDF source)

Content for the required PDF deliverable. Section 33 of the brief asks for eight
sections; each is below with the verified figures that back it.

> **Status note.** This document describes what has been built and verified in a
> **local environment**. Deployment configuration is prepared and validated but
> the hosted services are not yet live — that requires the owner's Render and
> Vercel accounts. Nothing here claims a deployment that has not happened.

---

## 1. Project Overview

### 1.1 Problem statement

Equipment held across multiple bases moves constantly: it is purchased,
transferred, issued to personnel, returned, and eventually written off. Without
a system, the answers to basic questions become guesswork:

- How much of each equipment type does each base actually hold?
- What went in, what came out, and why?
- Who issued this, and has it come back?
- Can this commander see another base's records?

Spreadsheets fail at this. They cannot enforce a role boundary, they drift when
two people edit at once, and they lose history the moment a cell is overwritten.
A row that used to say 500 and now says 480 gives no indication of whether 20
were consumed, transferred out, or simply mistyped.

### 1.2 Objectives

1. Record every movement of equipment with a permanent, append-only history
2. Make the current position derivable at any time, and provable
3. Enforce role-based access **on the server**, including base-level scoping
4. Record who did what, from where, and when
5. Present the position clearly to commanders and logistics staff

### 1.3 Features delivered

| Module | Capability |
|---|---|
Dashboard | Opening, closing, net movement, purchases, transfers, assigned, expended — with date, base and equipment filters |
Net Movement detail | Click any net figure to see the individual movements behind it |
Purchases | Record, view, filter, reverse |
Transfers | Full lifecycle with approval and two-sided stock movement |
Assignments | Issue to personnel, partial and full returns |
Expenditures | Write off, with optional link to the assignment consumed from |
Audit log | Every significant action, role-scoped |
Administration | Users, bases, equipment types |

### 1.4 Assumptions

- Equipment is either **individually serialised** (a vehicle or a rifle, with a
  serial number) or **bulk** (ammunition, held as a count). A single
  `isTrackable` flag on the equipment type expresses this.
- A base-scoped user belongs to exactly one base. An administrator belongs to none.
- Opening balances are a known baseline at go-live, not something derivable from
  later movements.
- Expiry of assignments is out of scope; `EXPIRED` exists in the schema but no
  automated process sets it.

### 1.5 Limitations

Honest list of what is **not** implemented:

- **No live deployment.** Configuration is prepared and locally validated; the
  hosted services require the owner's platform accounts.
- Closing balance is withheld under a date filter, because reconstructing stock
  as at a past date is not derivable from movement totals alone.
- Net movement detail is capped at 200 rows.
- No automated token cleanup; expired refresh tokens accumulate.
- No audit log export.
- Avatars are initials-derived; no image upload.
- Single currency, no tax or multi-currency handling.
- Rate limiting is in-memory, so it resets on restart and does not span instances.

---

## 2. Tech Stack and Architecture

### 2.1 Stack

| Layer | Technology | Reason |
|---|---|---|
Database | PostgreSQL 17 | Foreign keys, real `CHECK` constraints, `SUM() FILTER` aggregation, ACID transactions |
ORM | Prisma 6 | Reproducible SQL migrations; `$transaction` for atomic batches; parameterised queries |
Backend | Node.js 22, Express 5 | Single, well-understood middleware chain and one error path |
Auth | JWT + bcrypt (cost 12) | Stateless access token; refresh tokens hashed at rest so logout revokes |
Validation | Zod | Runtime schemas, one per endpoint |
Frontend | React 18, Vite 6 | Fast builds; static output deploys anywhere |
Routing | React Router 6 | Guards mirror the backend middleware |
HTTP | Axios | Interceptors handle token attach, refresh and expiry centrally |
Tests | `node --test` + Supertest | Node's built-in runner; one dependency instead of a framework |

**Deliberately omitted:** Redis, TypeORM, a UI component library, a CSS
framework, Docker. Each would add weight without earning it for this scope.

### 2.2 Why PostgreSQL rather than a document store

The domain is strongly relational: a transfer references two bases, an
expenditure may reference an assignment, and every figure on the dashboard is a
sum over several of those. Foreign keys make those relationships real rather than
conventional. `CHECK` constraints move invariants into the storage layer, where
they hold regardless of which code path wrote the row. And the conditional
`UPDATE` that prevents two concurrent requests from both taking the last
available rifles is a single statement in SQL — the whole reason the inventory
guarantee is a database property and not an application convention.

### 2.3 Request lifecycle

```
Browser
  │  Axios instance · Authorization: Bearer <jwt>
  ▼
Express
  helmet → cors → json → requestContext
  → authenticate     re-reads the user on every request
  → authorize(roles) role gate
  → validate(Zod)    body, query and params
  → resolveBaseScope returns a Prisma `where` fragment
  → controller       parse request, call service, shape response
  → service          business rules inside prisma.$transaction([
                        conditional stock decrement,
                        movement record,
                        audit log
                    ])
  ▼
PostgreSQL
```

Controllers never import Prisma. Services never touch `req`/`res`. That boundary
is what makes every business rule testable without an HTTP server.

---

## 3. Data Models

11 tables.

### 3.1 Entity relationships

```
                        ┌──────────────┐
                        │     User     │  role, baseId?, tokenVersion
                        └──┬────────┬──┘
              createdBy    │        │  userId
                 ┌─────────▼──┐   ┌─▼───────────────┐
                 │  Purchase  │   │    AuditLog     │
                 └─────┬──────┘   └─────────────────┘
                       │ purchaseId (opt)
                 ┌─────▼──────────────┐
                 │       Asset        │──► EquipmentType
                 └─────┬──────────────┘        ▲
       assetId (opt)   │                       │
                 ┌─────▼──────┐                │
   ┌────────────►│ Assignment │────────────────┤
   │             └─────┬──────┘                │
   │ assignmentId(opt) │                  ┌─────┴──────┐
   │             ┌─────▼──────┐           │    Base    │
   └─────────────│Expenditure │──────────►│            │
                 └────────────┘  baseId   └────────────┘
                                                  ▲
        sourceBaseId ──────────────────────────────┤
        destinationBaseId ────────────────────────┤
                              ┌───────────────────┴─────┐
                              │       Transfer          │
                              └─────────────────────────┘

   ┌────────────────────────────────────────┐
   │  StockBalance (baseId, equipmentTypeId)│  ← derived cache
   └────────────────────────────────────────┘
   ┌────────────────────────────────────────┐
   │  RefreshToken (userId)                  │  ← revocable sessions
   └────────────────────────────────────────┘
```

### 3.2 Key design decisions

**`StockBalance` holds two quantities, not one.** The assignment's own
specification is inconsistent if you keep one number: Closing Balance is defined
without assignments, yet the worked example subtracts them to reach "Available".
Those are different quantities. Conflating them double-counts assets.

| Column | Meaning |
|---|---|
`opening_quantity` | Stock at go-live. Recorded explicitly, not derived |
`on_hand_quantity` | Physically present |
`committed_quantity` | Issued to personnel, not yet returned or consumed |
`available` (derived) | `on_hand − committed` |

**`EquipmentType.isTrackable`** replaces a polymorphic hierarchy. Serialised
types get one `assets` row per physical item; bulk types are quantity only. A new
equipment category needs no code change.

**`reversedById` is `@unique`** on both `purchases` and `expenditures`. A ledger
entry can be corrected but never destroyed, and the uniqueness means a correction
cannot be applied twice.

**`User.tokenVersion`** is incremented on password change, role change and
deactivation. Any JWT issued before the current value stops validating — that is
how forced revocation works without a token blacklist.

**No hard deletes.** Bases, equipment types and users are deactivated. A base
referenced by six months of history has to stay resolvable.

---

## 4. The Inventory Model

### 4.1 Equations

```
Closing balance = opening + purchases + transferIn − transferOut − expenditure
Net movement    = purchases + transferIn − transferOut
Available       = Closing balance − committed
```

Two deliberate choices:

- **The opening balance is never date-filtered.** It is the state entering the
  period. Filtering it silently breaks the closing equation — the classic bug in
  hand-rolled balance reports.
- **Closing balance is `null` under a date filter.** Reconstructing stock as at a
  past date needs more than movement totals. The API withholds it with an
  explanation rather than inventing a figure.

### 4.2 Movement rules

Every stock change goes through `inventoryService.applyMovement`, the only
function that writes to `stock_balances`.

| Movement | `onHand` | `committed` | Guard | Used by |
|---|---:|---:|---|---|
`RECEIVE` | `+q` | — | none | purchase, inbound transfer |
`RELEASE_ON_HAND` | `−q` | — | `onHand ≥ q` | outbound transfer, unassigned write-off |
`COMMIT` | — | `+q` | `available ≥ q` | issue to personnel |
`RELEASE_COMMITTED` | — | `−q` | `committed ≥ q` | return from personnel |
`EXPEND_ISSUED` | `−q` | `−q` | `onHand ≥ q` | consumed while issued |

The asymmetry is the point. Issuing equipment does not remove it from the base,
so only `committed` moves. Writing it off does remove it, so only `onHand` moves.

### 4.3 The double-count problem

A rifle issued to a soldier and then consumed in training must clear **both**
columns: `onHand` because it is gone, and `committed` because the outstanding
obligation is discharged. The optional `assignmentId` on `Expenditure` is what
lets a single movement do both.

Without it, the same asset is counted twice — once as missing stock, once as
stock still owed back.

A consequence worth stating: because `committed ≤ onHand` is a database
constraint, an **unlinked** write-off may only draw on *available* stock.
Consuming issued equipment requires naming the assignment it came from. The
service returns a 409 explaining this rather than letting the constraint raise a
500.

### 4.4 Concurrency

Stock is checked with a conditional `UPDATE`, not read-then-write:

```sql
UPDATE stock_balances
   SET on_hand_quantity = on_hand_quantity - 10
 WHERE base_id = $1 AND equipment_type_id = $2
   AND on_hand_quantity >= 10
```

Zero affected rows means another request took the stock first. **PostgreSQL
decides, not application code.** A naive `findUnique` → compare → `update` leaves
a window in which two concurrent requests for the last ten rifles both see ten and
both succeed.

`assertSufficientForIssue` and `assertSufficientForExpenditure` produce readable
messages. They are a courtesy; the conditional `UPDATE` is the guarantee.

### 4.5 The cache is provably derivable

`stock_balances` is a cache. The ledger rows are the source of truth. Every write
happens inside the same `$transaction` as its movement. `npm run verify:inventory`
rebuilds every balance from SQL aggregation and compares:

```
No drift. All 12 stock balances match the ledger.
```

---

## 5. Role-Based Access Control

### 5.1 Matrix

| Capability | Admin | Base Commander | Logistics Officer |
|---|:---:|:---:|:---:|
Scope | all bases | own base only | own base only |
View dashboard | ✅ | ✅ own base | ✅ |
View purchases | ✅ | ✅ own base | ✅ scoped |
Create purchase | ✅ | ❌ | ✅ |
Reverse purchase | ✅ | ❌ | ❌ |
View transfers | ✅ | ✅ either end | ✅ scoped |
Create transfer | ✅ | ✅ from own base | ✅ |
Approve / reject | ✅ | ✅ source, **not initiator** | ❌ |
Complete transfer | ✅ | ❌ | ✅ destination |
Cancel transfer | ✅ | ✅ own | ✅ own |
Create assignment | ✅ | ✅ own base | ✅ scoped |
Record return | ✅ | ✅ own base | ✅ scoped |
Record expenditure | ✅ | ✅ own base | ❌ |
Reverse expenditure | ✅ | ❌ | ❌ |
Manage users / roles | ✅ | ❌ | ❌ |
Manage bases / equipment | ✅ | ❌ | ❌ |
Audit log | ✅ all | ✅ own base's records | ✅ own actions |

### 5.2 Two independent layers

The frontend hides what a role cannot use. **That is presentation only.** The
backend refuses every one of those actions independently, proven in the browser
by presenting each role with its own valid token and receiving `403`.

### 5.3 Resource-level authorization

`resolveBaseScope` returns a **Prisma `where` fragment**, not a boolean:

```js
export function resolveBaseScope(user, requestedBaseId) {
  if (user.role === ROLES.ADMIN) {
    return requestedBaseId ? { baseId: requestedBaseId } : {};
  }
  if (!user.baseId) throw ApiError.forbidden("Your account has no base assigned.");
  if (requestedBaseId && Number(requestedBaseId) !== Number(user.baseId)) {
    throw ApiError.forbidden("You are not authorised to access another base");
  }
  return { baseId: user.baseId };
}
```

Services merge it: `where: { ...filters, ...scope }`. A boolean check can be
forgotten at a call site; this cannot be bypassed by forgetting, because there is
nothing to forget.

Single-record reads outside scope return **404 rather than 403**, so the
endpoint cannot be used to probe other bases by walking ids.

### 5.4 Additional controls

- **Four-eyes approval** — a transfer cannot be approved by its initiator
- **Admin re-authentication** — changing a user's role requires the acting
  admin's own password, so a stolen admin session cannot quietly promote an
  attacker
- **Self-role-change blocked** — an admin cannot change their own role
- **Last-admin guard** — the final active administrator cannot be deactivated

---

## 6. API and Audit Logging

### 6.1 API surface

48 endpoints across 10 groups. Every response uses one envelope:

```jsonc
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "...", "error": "VALIDATION_ERROR" }
```

Full detail: [`docs/api-documentation.md`](api-documentation.md).

### 6.2 Audit architecture

Every significant action writes an `audit_logs` row containing user, action,
entity type and id, HTTP method, endpoint, IP address, user agent, a correlation
request id, and JSON metadata.

Recorded actions cover authentication (`LOGIN`, `LOGIN_FAILED`, `LOGOUT`),
user administration, master data, and every ledger operation
(`PURCHASE_CREATED`, `TRANSFER_APPROVED`, `TRANSFER_COMPLETED`,
`EXPENDITURE_REVERSED`, …).

Three properties:

1. **Audit rows share the business transaction.** If the movement rolls back, so
   does its audit entry. The log can never claim something happened that did not.
2. **Redaction is centralised.** Any key matching
   `password|token|secret|hash|authorization|credential` is replaced with
   `[redacted]`, so a future developer who logs a whole request body still cannot
   leak a credential.
3. **`userEmail` is snapshotted**, so the log still identifies the actor after
   the user record is removed.

Audit access is scoped by a **query filter**, not rows hidden in JavaScript.

---

## 7. Setup and Running

### 7.1 Requirements

Node.js 20+, PostgreSQL 14+, npm.

### 7.2 Database

```sql
CREATE DATABASE mams;
CREATE ROLE mams_user LOGIN PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mams TO mams_user;
GRANT ALL ON SCHEMA public TO mams_user;
ALTER ROLE mams_user CREATEDB;   -- migrate dev builds a shadow database
```

A dedicated role rather than the superuser contains any bug to one database, and
matches how a hosted provider issues credentials.

### 7.3 Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit DATABASE_URL and the two secrets
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev                   # http://localhost:5000
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 7.4 Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # http://localhost:5173
```

### 7.5 Verification

```bash
cd backend
npm test                      # 75 tests, 11 suites
npm run verify:inventory      # must say "No drift"
npm run verify:constraints    # 6/6 constraints rejecting invalid data
```

### 7.6 Demo credentials

All accounts share `Passw0rd@2026`.

| Email | Role | Base |
|---|---|---|
`admin@mams.local` | Admin | all |
`commander.alpha@mams.local` | Base Commander | Alpha Base |
`commander.bravo@mams.local` | Base Commander | Bravo Base |
`commander.charlie@mams.local` | Base Commander | Charlie Base |
`logistics.alpha@mams.local` | Logistics Officer | Alpha Base |
`logistics.charlie@mams.local` | Logistics Officer | Charlie Base |

---

## 8. Verification Evidence

Every figure below was produced by running the system, not by inspection.

### 8.1 Backend test suite

```
# tests 75
# suites 11
# pass 75
# fail 0
```

Covering authentication, RBAC, cross-base denial, purchase validation, the full
transfer lifecycle, the inventory two-quantity rules, dashboard arithmetic,
pagination, and audit logging.

### 8.2 Inventory reconciliation

Run after the seed, and again after ~40 API-driven mutations:

```
No drift. All 12 stock balances match the ledger.
```

The second run is the significant one: it proves the cache stays consistent with
history written through real transactions, not merely with generated seed data.

### 8.3 Constraint verification

```
6/6 constraints are actively rejecting invalid data.
1 probe accepted by design, because no row-level rule can enforce it.
Result: PASSED
```

Each probe runs in a transaction that is rolled back, and each asserts the
**named** constraint fired, so an unrelated foreign-key failure cannot produce a
false pass.

### 8.4 Database dump restore

```
bases 3 · equipment_types 4 · users 6 · stock_balances 12
purchases 26 · transfers 33 · assignments 26 · expenditures 29
11 CHECK constraints · 26 foreign keys
same-base transfer REJECTED by the restored constraint
Result: PASSED
```

A dump that has never been restored is a claim. This one restores, and the
behavioural check confirms the constraint is *enforced*, not merely present.

### 8.5 Browser verification

All screens confirmed against the live API with **zero console errors**:
login, dashboard, purchases, transfers, movements, audit log, users, bases,
equipment types.

Dashboard arithmetic matched the specification exactly:

```
Closing = 271,082 + 198,178 + 114,129 − 114,129 − 21,877 = 447,383
Net movement = 198,178 + 114,129 − 114,129 = 198,178
```

RBAC verified in the browser. A Base Commander's navigation shows only Dashboard,
Purchases, Transfers, Movements and Audit Logs; typing `/users` redirects to
`/forbidden`; and calling the API with that commander's **own valid token**
returns `403` for every administrative operation.

### 8.6 Bugs found by these checks

Verification was not a formality — it found seven real defects:

| Bug | Effect | Found by |
|---|---|---|
Login route behind `router.use(authenticate)` | **Nobody could sign in** | test suite |
`referenceNumber` placeholder 40 chars vs `varchar(30)` | **Every ledger write failed** | test suite |
`applyMovement` rejected its own callers | **Every ledger write failed** | test suite |
Unlinked write-off returned 500 not 409 | Confusing server error instead of an explanation | test suite |
Reconciliation omitted `openingQuantity` | Phantom drift on all 12 balances | reconciliation |
Seed allowed `committed > onHand` | **Impossible data accepted** | DB constraint |
Filter chips rendered internal state | Leaked `page: 1`, `[object Object]` to users | screenshot |

The first three would each have made the system unusable while still passing a
successful build.

---

## 9. Screenshots

Captured from the running local application. **All are the local demo
environment; none are from a hosted deployment.**

| File | Shows |
|---|---|
`01-login.png` | Login with demo-account shortcuts |
`02-dashboard-admin.png` | Admin dashboard, all bases, eight figures |
`03-net-movement-modal.png` | Net Movement breakdown, 44 movements |
`04-purchases.png` | Purchases, including a reversed entry |
`05-transfers.png` | Transfers across all five lifecycle states |
`06-movements.png` | Assignments with issued/returned/outstanding |
`07-audit-logs.png` | Audit log with actions and request paths |
`08-users.png` | Users by role and base |
`09-bases.png` | Base master data |
`10-equipment-types.png` | Catalogue, serialised vs bulk |
`11-dashboard-base-commander.png` | Base Commander — scoped to Alpha Base only |
`12-forbidden-non-admin.png` | Frontend guard on `/users` |

Screenshots 02 and 11 make the RBAC difference visible: opening balance
**271,082** for the admin against **96,534** for Alpha's commander.

---

## 10. Deployment Status

**Configuration prepared and locally validated. Not deployed.**

| Component | Target | State |
|---|---|---|
Database | Render PostgreSQL / Neon | Blueprint prepared |
API | Render | `render.yaml` prepared, validated as YAML |
Frontend | Vercel or Netlify | `vercel.json`, `netlify.toml` prepared |
Production bootstrap | — | `seed:production` validated on a scratch database |

Locally validated without deploying:

- `render.yaml` parses; service and database correctly paired
- Production guards refuse to boot with short or identical JWT secrets
- `prisma migrate deploy` applied both migrations on an empty database
- `seed:production` produced 3 bases, 4 equipment types, **1 admin, 0 movements**
- Production frontend build confirmed to compile the API URL into the bundle
- SPA rewrite configured for both hosts, without which a deep-link refresh
  returns 404

Live deployment requires the owner's Render and Vercel accounts and a git remote;
neither exists yet. The repository is at commit `f4af28f` with a clean working
tree and 119 tracked files.

### Production notes

- Use the **non-pooled** database URL. The pooled endpoint runs PgBouncer in
  transaction mode, and DDL such as `CREATE TYPE` cannot run inside it, so
  migrations fail with a misleading error.
- `VITE_API_URL` is compiled at build time; changing it requires a redeploy.
- Set `CORS_ORIGIN` to the deployed frontend origin.
- Do **not** run the demo seed in production. `seed:production` creates only
  master data and one administrator.
