# Military Asset Management System

A web-based system for managing the movement, assignment, purchase and
expenditure of military equipment across multiple bases, with full transaction
history and role-based access control.

All data in this repository is fictional demo data: invented base names,
suppliers and personnel. No real unit names, serial numbers or operational
quantities appear anywhere.

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [The inventory model](#the-inventory-model)
- [Database design](#database-design)
- [Role-based access control](#role-based-access-control)
- [Audit logging](#audit-logging)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [Verification commands](#verification-commands)
- [Demo credentials](#demo-credentials)
- [API overview](#api-overview)
- [Project layout](#project-layout)
- [Deployment](#deployment)

---

## What it does

Commanders and logistics staff can see, for any base, any date range and any
equipment type:

- **Opening balance** — stock held when the period began
- **Purchases** — recorded receipts that increase stock
- **Transfer in / out** — movement between bases, with an approval lifecycle
- **Assigned** — equipment issued to named personnel
- **Expended** — equipment written off
- **Closing balance** — stock on hand at the end of the period
- **Net movement** — purchases + transfer in − transfer out

Every figure comes from a SQL aggregate on the server. Nothing is calculated in
the browser, and no balance is a manually editable number.

Clicking **Net movement** opens a modal listing every purchase and transfer that
produced the figure, with quantity, date, equipment type, both bases and the
transaction reference.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Database | PostgreSQL 17 | Dense foreign-key relationships, real `CHECK` constraints, `SUM() FILTER` aggregation, ACID transactions |
| ORM | Prisma 6 | Migrations produce reproducible SQL; `$transaction` gives atomic batches; queries are parameterised |
| Backend | Node.js 22 + Express 5 | Mature middleware model; `app.use(errorHandler)` gives a single error path |
| Auth | JWT (access + refresh) + bcrypt (cost 12) | Stateless access token; **refresh tokens stored hashed** so logout actually revokes |
| Validation | Zod | Runtime schemas; one definition per endpoint |
| Security | Helmet, CORS allow-list, rate limiting | Locked-down defaults without a security dependency |
| Frontend | React 18 + Vite 6 | Instant HMR; a static build that deploys to any host |
| Routing | React Router 6 | `ProtectedRoute` / `RequirePermission` mirror the backend middleware |
| HTTP client | Axios | Interceptors handle token attach, refresh and expiry in one place |
| Tests | `node --test` + Supertest | Node's built-in runner; one dependency, not a framework |

Deliberately **not** used: Redis (single instance), TypeORM, a UI kit, a CSS
framework, Docker. Each would add weight without earning it.

---

## Architecture

```
React + Vite (JS/JSX)
   │  Axios instance ── one place, interceptors for token + refresh
   │  REST /api/*  ·  Authorization: Bearer <jwt>
   ▼
Express
   helmet → cors → json → requestContext
   → authenticate → authorize(roles) → validate(Zod) → resolveBaseScope
   → controller → service → prisma.$transaction([...])
   ▼
PostgreSQL
   11 tables · foreign keys · indexes · 11 CHECK constraints
```

**Request lifecycle for any inventory-changing operation:**

```
HTTP request
  → helmet / CORS / rate limit
  → authenticate      valid, unexpired token; user re-read from DB
  → authorize(...)    role gate
  → validate(Zod)     types, ranges, enums, dates
  → resolveBaseScope  builds a Prisma `where` fragment
  → service           business rules inside $transaction:
        · conditional stock decrement   ← atomic compare-and-set
        · movement record insert
        · audit log insert
  → 201 { success, message, data }
```

Controllers never touch Prisma. Services never touch `req`/`res`. That is what
makes every business rule testable without HTTP.

---

## The inventory model

This is the part worth reading carefully.

### Two quantities, not one

The assignment specification gives a Closing Balance formula that excludes
assignments, but its own worked example subtracts assignments to reach
"Available". Those are two different numbers, and conflating them double-counts
assets.

So each `(base, equipment type)` pair tracks two values in `stock_balances`:

| Column | Meaning |
|---|---|
| `on_hand_quantity` | Physically present at the base |
| `committed_quantity` | Issued to personnel, not yet returned or consumed |
| `available` | `on_hand − committed` (derived) |

```
Closing balance = opening + purchases + transferIn − transferOut − expenditure
Available       = Closing balance − committed
```

### Movement rules

Every change to stock goes through `inventoryService.applyMovement`, the only
function that writes to `stock_balances`.

| Movement | `onHand` | `committed` | Guard |
|---|---:|---:|---|
| `RECEIVE` (purchase, inbound transfer) | `+q` | — | none |
| `RELEASE_ON_HAND` (outbound transfer, unassigned write-off) | `−q` | — | `onHand ≥ q` |
| `COMMIT` (issue to personnel) | — | `+q` | `available ≥ q` |
| `RELEASE_COMMITTED` (return) | — | `−q` | `committed ≥ q` |
| `EXPEND_ISSUED` (consumed while issued) | `−q` | `−q` | `onHand ≥ q` |

The asymmetry between `COMMIT` and `RELEASE_ON_HAND` is the point. Issuing
equipment does not remove it from the base, so only `committed` moves. Writing
equipment off does remove it, so only `onHand` moves.

### Why expenditures carry an `assignmentId`

A rifle issued to a soldier and then consumed in training has to clear **both**
columns: `onHand` because it is gone, and `committed` because the outstanding
obligation is discharged. The optional `assignmentId` link is what lets one
movement do both. Without it the same asset is counted twice — once as missing
stock, once as stock still owed back.

This also means an **unlinked** write-off may only draw on *available* stock,
because `committed` stays put and the database enforces `committed ≤ onHand`.
Consuming issued stock requires naming the assignment it came from. The service
returns a clear 409 explaining this rather than letting the constraint throw.

### The concurrency guarantee

Stock is checked with a conditional `UPDATE`, not a read-then-write:

```sql
UPDATE stock_balances
   SET on_hand_quantity = on_hand_quantity - 10
 WHERE base_id = $1 AND equipment_type_id = $2
   AND on_hand_quantity >= 10
```

If zero rows are affected, another request took the stock first. **PostgreSQL
decides, not application code.** A naive `findUnique` → compare → `update` has a
window where two concurrent requests for the last ten rifles both see ten and
both succeed.

`assertSufficientForIssue` and `assertSufficientForExpenditure` produce readable
error messages. They are a courtesy; the conditional `UPDATE` is the guarantee.

### The cache is provably derivable

`stock_balances` is a **cache**, not the source of truth. The ledger rows are.

- Every write happens inside the same `$transaction` as the movement it belongs to
- `npm run verify:inventory` rebuilds every balance from SQL aggregation over the
  ledger and compares it with the cache
- The test suite asserts the same invariant *after* writing through the API

```
No drift. All 12 stock balances match the ledger.
```

---

## Database design

11 application tables plus Prisma's migration table.

| Table | Purpose |
|---|---|
| `bases` | Locations holding equipment |
| `equipment_types` | Catalogue; `is_trackable` separates serialised from bulk |
| `users` | Accounts, roles, base assignment, `token_version` |
| `assets` | Individually serialised items (trackable types only) |
| `purchases` | Append-only receipts |
| `transfers` | Inter-base movement with a lifecycle |
| `assignments` | Equipment issued to personnel |
| `expenditures` | Equipment written off |
| `stock_balances` | Derived cache, unique on `(base_id, equipment_type_id)` |
| `audit_logs` | Every significant action |
| `refresh_tokens` | Hashed, revocable sessions |

Relationships:

```
Base ──┬── User ──────────┬── AuditLog
       │                  └── RefreshToken
       ├── Asset
       ├── StockBalance
       ├── Purchase ──────┐
       ├── Assignment ◄───┴── Expenditure
       └── Transfer

EquipmentType ──┬── Asset
                ├── Purchase / Transfer / Assignment / Expenditure
                └── StockBalance
```

### Immutable history

`purchases` and `expenditures` are never edited or deleted. A mistake is
corrected by writing a **reversal** row. `reversed_by_id` is `@unique`, so an
entry can only be reversed once — otherwise a correction could be applied twice.

`bases`, `equipment_types` and `users` are never hard-deleted either. They are
deactivated, which hides them from selection lists while keeping every
historical record readable.

### Constraints at the storage layer

11 `CHECK` constraints, applied by the second Prisma migration
(`add_inventory_constraints`), because Prisma's schema language cannot express
them:

```sql
CHECK (quantity > 0)                            -- all four ledger tables
CHECK (source_base_id <> destination_base_id)   -- transfers
CHECK (asset_id IS NOT NULL OR equipment_type_id IS NOT NULL)
CHECK (returned_quantity BETWEEN 0 AND quantity)
CHECK (on_hand_quantity >= 0 AND committed_quantity >= 0)
CHECK (committed_quantity <= on_hand_quantity)
CHECK (purchase_date <= CURRENT_DATE + INTERVAL '1 day')
```

Zod protects the API surface. These hold even when something writes to
PostgreSQL without going through the API.

Note the deliberate absence: a `CHECK` may not contain a subquery, so cross-table
rules live in the service layer. That a referenced assignment belongs to the
same base needs a join, and is enforced by `expenditureService`.

`npm run verify:constraints` proves each rule rejects invalid data, using
rolled-back transactions so nothing is persisted. One probe is **expected to be
accepted** — a large positive quantity is a valid row, and no row-level rule can
tell that a base does not hold the stock.

---

## Role-based access control

### Matrix

| Capability | Admin | Base Commander | Logistics Officer |
|---|:---:|:---:|:---:|
| Scope | all bases | own base only | own base only |
| View dashboard | ✅ | ✅ own base | ✅ own base |
| View purchases | ✅ | ✅ own base | ✅ scoped |
| Create purchase | ✅ | ❌ | ✅ |
| Reverse purchase | ✅ | ❌ | ❌ |
| View transfers | ✅ | ✅ own base (either end) | ✅ scoped |
| Create transfer | ✅ | ✅ from own base | ✅ |
| Approve / reject | ✅ | ✅ source base, **not the initiator** | ❌ |
| Complete transfer | ✅ | ❌ | ✅ destination base |
| Cancel transfer | ✅ | ✅ own, pending/approved | ✅ own |
| Create assignment | ✅ | ✅ own base | ✅ scoped |
| Record return | ✅ | ✅ own base | ✅ scoped |
| Record expenditure | ✅ | ✅ own base | ❌ |
| Reverse expenditure | ✅ | ❌ | ❌ |
| Manage users / roles | ✅ | ❌ | ❌ |
| Manage bases / equipment types | ✅ | ❌ | ❌ |
| Audit log | ✅ all | ✅ own base's records | ✅ own actions |

### Two independent layers

The frontend hides what a role cannot use. **That is presentation only.** The
backend refuses every one of those actions independently, and the test suite
proves it by presenting each role with its own valid token.

### Resource-level authorization

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

Services merge it into the query: `where: { ...filters, ...scope }`. A boolean
check can be forgotten at a call site; this cannot be bypassed by forgetting,
because there is nothing to forget.

For single-record reads outside scope, the API returns **404 rather than 403**,
so the endpoint cannot be used to discover which records exist at other bases.

### Four-eyes approval

A transfer cannot be approved by the person who initiated it. Without this the
approval step proves nothing.

### Admin re-authentication

Changing a user's **role** requires the acting admin to re-enter their own
password. A stolen admin session could otherwise quietly promote an attacker,
and the audit trail would look routine. An admin also cannot change their own
role, and the last active admin cannot be deactivated.

---

## Audit logging

Every significant action writes an `audit_logs` row: user, action, entity,
method, endpoint, IP address, user agent, request id and JSON metadata.

Actions cover authentication (`LOGIN`, `LOGIN_FAILED`, `LOGOUT`), user
administration, master data, and every ledger operation
(`PURCHASE_CREATED`, `TRANSFER_APPROVED`, `TRANSFER_COMPLETED`,
`EXPENDITURE_REVERSED`, …).

Three properties worth noting:

- **Audit rows share the business transaction.** If the movement rolls back, so
  does its audit entry. The log can never claim something happened that did not.
- **Redaction is centralised.** Any key matching
  `password|token|secret|hash|authorization|credential` is replaced, so a future
  developer who logs a whole request body still cannot leak a credential.
- **`user_email` is snapshotted.** If a user record is deleted, the log still
  identifies who acted.

Audit access is scoped: admins see everything, a base commander sees entries for
their own base's records, a logistics officer sees their own actions. The
restriction is a **query filter**, not rows hidden in JavaScript.

---

## Running it locally

### Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm

### 1. Database

```sql
CREATE DATABASE mams;
CREATE ROLE mams_user LOGIN PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mams TO mams_user;
GRANT ALL ON SCHEMA public TO mams_user;
-- `migrate dev` builds a shadow database, so the role also needs:
ALTER ROLE mams_user CREATEDB;
```

Using a dedicated role rather than the superuser means a bug is contained to one
database, and matches how a hosted provider issues credentials.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit DATABASE_URL and the two secrets
npm run prisma:generate
npm run prisma:migrate    # applies both migrations
npm run seed
npm run dev               # http://localhost:5000
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port, default 5000 |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs access tokens; min 32 chars, must differ from the refresh secret |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `JWT_EXPIRES_IN` | Access token lifetime, default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime, default `7d` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |

The process refuses to start in production if the secrets are short or
identical. `.env` is gitignored; `.env.example` is committed.

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL, e.g. `https://mams-api.onrender.com/api` |

Only `VITE_`-prefixed variables reach the browser, so no secret can be placed
here. The value is baked in at **build** time.

---

## Verification commands

```bash
cd backend

npm test                        # 75 tests across 11 suites
npm run verify:inventory        # cache vs ledger — must say "No drift"
npm run verify:constraints      # 6/6 constraints rejecting invalid data
npm run prisma:studio           # browse the data
```

`npm test` re-seeds before running, so results are reproducible.

---

## Demo credentials

All accounts share the password **`Passw0rd@2026`**.

| Email | Role | Base |
|---|---|---|
| `admin@mams.local` | Admin | all |
| `commander.alpha@mams.local` | Base Commander | Alpha Base |
| `commander.bravo@mams.local` | Base Commander | Bravo Base |
| `commander.charlie@mams.local` | Base Commander | Charlie Base |
| `logistics.alpha@mams.local` | Logistics Officer | Alpha Base |
| `logistics.charlie@mams.local` | Logistics Officer | Charlie Base |

The seed creates 3 bases, 4 equipment types, 26 serialised assets and roughly 60
days of coherent movement history.

---

## API overview

48 endpoints across 10 groups. Every response uses the same envelope:

```jsonc
// success
{ "success": true, "message": "...", "data": { } }

// error
{ "success": false, "message": "...", "error": "VALIDATION_ERROR" }
```

Paginated responses return
`{ page, limit, total, totalPages, data: [...] }`.

| Group | Endpoints | Methods |
|---|---|---|
| `/api/auth` | 6 | register, login, refresh, logout, me, change-password |
| `/api/users` | 4 | list, get, create, update |
| `/api/bases` | 5 | list, get, create, update, usage |
| `/api/equipment-types` | 7 | list, list-all, get, create, update, usage, by-base |
| `/api/purchases` | 4 | list, get, create, reverse |
| `/api/transfers` | 7 | list, get, create, approve, reject, cancel, complete |
| `/api/assignments` | 4 | list, get, create, return |
| `/api/expenditures` | 4 | list, get, create, reverse |
| `/api/dashboard` | 4 | summary, movements, net-movement-details, filters |
| `/api/audit-logs` | 3 | list, get, filter-options |

Full detail, including request bodies, query parameters and possible errors, is
in [`docs/api-documentation.md`](docs/api-documentation.md).

---

## Project layout

```
military-asset-management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              11 models
│   │   ├── migrations/                init + add_inventory_constraints
│   │   ├── manual/                    reference copy of the CHECK SQL
│   │   └── seed.js                    demo data
│   ├── scripts/
│   │   ├── reconcile-inventory.js     rebuild balances from the ledger
│   │   └── verify-constraints.js      prove the CHECK constraints hold
│   ├── src/
│   │   ├── config/     env, prisma client, constants, permissions
│   │   ├── controllers/ one per resource, thin
│   │   ├── middleware/ authenticate, validate, baseScope, errorHandler, …
│   │   ├── routes/     one per resource group
│   │   ├── services/   business rules, transactions, inventory engine
│   │   ├── utils/      ApiError, response, tokenService, password, reference
│   │   ├── validators/ Zod schemas
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/          4 suites, 75 tests
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/        one axios client, one module per resource
│       ├── auth/       AuthContext, ProtectedRoute
│       ├── components/ layout, ui, filters
│       ├── hooks/      useApiQuery, useMutation, useDebounced
│       ├── pages/      10 screens
│       ├── styles/
│       └── App.jsx
├── database/
│   └── database-dump.sql
├── docs/
│   ├── api-documentation.md
│   ├── project-documentation.md
│   ├── video-walkthrough.md
│   └── screenshots/            12 screens from the local application
├── DEPLOY.md
├── render.yaml
└── README.md
```

---

## Documentation

| Document | Contents |
|---|---|
[`docs/api-documentation.md`](docs/api-documentation.md) | All 48 endpoints, with auth, roles, examples, errors and lifecycle behaviour |
[`docs/project-documentation.md`](docs/project-documentation.md) | PDF source: overview, architecture, data models, RBAC, API, setup, evidence, screenshots |
[`docs/video-walkthrough.md`](docs/video-walkthrough.md) | Timed 4:30 narration script for the video deliverable |
[`docs/screenshots/`](docs/screenshots/) | 12 screens captured from the running local application |
[`DEPLOY.md`](DEPLOY.md) | Deployment walkthrough and troubleshooting |
[`database/database-dump.sql`](database/database-dump.sql) | PostgreSQL dump with demo data; restore verified by `npm run verify:restore` |

---

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for the full walkthrough.

| Component | Target | Notes |
|---|---|---|
| Database | Neon / Supabase / Render PostgreSQL | Use the **non-pooled** connection string for migrations |
| Backend | Render | `prisma migrate deploy` on release, then start |
| Frontend | Vercel / Netlify | `VITE_API_URL` set as a build-time variable |

### Production notes

- **Use the non-pooled database URL.** The pooled endpoint runs PgBouncer in
  transaction mode, and DDL such as `CREATE TYPE` cannot run inside it, so
  `migrate deploy` fails with a misleading error.
- **Build the frontend after setting `VITE_API_URL`.** It is compiled into the
  bundle; changing it later requires a redeploy.
- **Demo accounts are for demonstration.** Remove or re-password them before a
  real deployment.
