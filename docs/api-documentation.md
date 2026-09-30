# API Documentation

48 endpoints across 10 resource groups.

Base URL in development: `http://localhost:5000/api`

---

## Conventions

### Response envelope

Every response uses the same shape, so a client never has to guess.

```jsonc
// success
{
  "success": true,
  "message": "Purchase recorded",
  "data": { }
}
```

```jsonc
// error
{
  "success": false,
  "message": "Insufficient stock: 12 available, 40 requested",
  "error": "ApiError",
  "details": [                        // present on validation failures
    { "field": "quantity", "message": "Quantity must be greater than zero" }
  ]
}
```

`error` is a stable machine-readable code, `message` is for a human, and
`details` appears only for validation failures.

### Authentication

Protected endpoints require a bearer token:

```
Authorization: Bearer <accessToken>
```

Tokens are **not** returned in query strings, never logged, and never include
the password hash.

### Status codes

| Code | Meaning |
|---|---|
`200` | Success |
`201` | Resource created |
`400` | Validation failed — see `details` |
`401` | Missing, invalid or expired token |
`403` | Authenticated but not permitted (role or base scope) |
`404` | Not found — also returned for a record outside the caller's base scope |
`409` | Conflict — insufficient stock, duplicate code, illegal state transition |
`429` | Rate limit exceeded on `/api/auth/login` |
`500` | Unexpected server error (details never exposed in production) |
`503` | Database unreachable |

### Pagination and filtering

List endpoints accept:

```
?page=1&limit=20&dateFrom=2026-08-01&dateTo=2026-09-30&baseId=3&equipmentTypeId=2
```

and return:

```jsonc
{
  "success": true,
  "data": {
    "page": 1,
    "limit": 20,
    "total": 137,
    "totalPages": 7,
    "data": [ /* rows */ ]
  }
}
```

`limit` is capped at 100. Exceeding it returns `400` rather than silently
returning everything.

---

## Authentication — `/api/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
POST | `/register` | — | Self-registration. Cannot create an ADMIN |
POST | `/login` | — | Rate limited to 10 per 15 min per IP |
POST | `/refresh` | refresh token | Rotates the token; replay detection |
POST | `/logout` | bearer | Revokes the session immediately |
GET | `/me` | bearer | Current user, base and permission list |
POST | `/change-password` | bearer | Revokes all sessions for that user |

### `POST /api/auth/login`

```jsonc
// request
{
  "email": "commander.alpha@mams.local",
  "password": "Passw0rd@2026"
}

// 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 8,
      "name": "Col. Devansh Kulkarni",
      "email": "commander.alpha@mams.local",
      "role": "BASE_COMMANDER",
      "baseId": 47,
      "base": { "id": 47, "code": "ALPHA", "name": "Alpha Base" }
    }
  }
}
```

A wrong password and an unknown account return the **same** message, so the
form cannot be used to discover which accounts exist:

```jsonc
// 401
{ "success": false, "message": "Invalid email or password", "error": "ApiError" }
```

### `GET /api/auth/me`

```jsonc
// 200
{
  "data": {
    "user": { "id": 8, "role": "BASE_COMMANDER", "baseId": 47, "...": "" },
    "permissions": [
      "dashboard:read", "purchases:read", "transfers:read",
      "assignments:read", "expenditures:read", "audit:read"
    ]
  }
}
```

The permission list drives what the frontend renders. Every one of those actions
is independently enforced by the backend.

---

## Users — `/api/users`

All routes require **ADMIN**.

| Method | Path | Notes |
|---|---|---|
GET | `/` | Paginated. Filters: `role`, `baseId`, `includeInactive`, `search` |
GET | `/:id` | Single user |
POST | `/` | Create account with an initial password |
PATCH | `/:id` | Update name, email, role, base or active status |

### `PATCH /api/users/:id`

A **role change requires the acting admin's own password**:

```jsonc
// request
{
  "role": "BASE_COMMANDER",
  "baseId": 47,
  "currentPassword": "your-own-admin-password"
}
```

| Situation | Response |
|---|---|
Role change with no `currentPassword` | `400` |
Role change with wrong password | `403` |
Admin changing their own role | `400` |
Deactivating the last active admin | `409` |
Any role change | Bumps `tokenVersion`, so the target's sessions end immediately |

```jsonc
// 409
{ "success": false, "message": "Cannot deactivate the last active administrator", "error": "ApiError" }
```

---

## Bases — `/api/bases`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated |
GET | `/:id` | any authenticated |
POST | `/` | ADMIN |
PATCH | `/:id` | ADMIN |
GET | `/:id/usage` | ADMIN |

**There is no delete endpoint.** A base is referenced by inventory, movements and
user accounts. Deactivating it hides it from selection lists while keeping every
historical record readable.

`code` is immutable once set, because it is the identifier used in reports and
in conversation.

```jsonc
// GET /api/bases/1/usage  (ADMIN)
{ "users": 2, "assets": 9, "purchases": 12, "transfersOut": 6,
  "transfersIn": 4, "assignments": 8, "expenditures": 5, "stockBalances": 4 }
```

---

## Equipment Types — `/api/equipment-types`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated |
GET | `/all` | any authenticated |
GET | `/:id` | any authenticated |
GET | `/base/:id` | any authenticated, own base unless ADMIN |
POST | `/` | ADMIN |
PATCH | `/:id` | ADMIN |
GET | `/:id/usage` | ADMIN |

`isTrackable` separates serialised equipment (one `assets` row per physical item)
from bulk stock (quantity only).

`code` and `category` are immutable. `isTrackable` can only change while the type
has no movement history:

```jsonc
// 409
{
  "success": false,
  "message": "Trackability cannot be changed once this type has movement history. Create a new equipment type instead.",
  "error": "ApiError"
}
```

Changing it would reinterpret what the existing records mean, so the fix is a new
type rather than a reinterpretation of the past.

> **`GET /all` must be declared before `GET /:id`.** Otherwise Express matches
> the literal `"all"` as an id and the validator rejects it.

---

## Purchases — `/api/purchases`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated, scoped |
GET | `/:id` | any authenticated, scoped |
POST | `/` | ADMIN, LOGISTICS_OFFICER |
POST | `/:id/reverse` | ADMIN |

Filters: `dateFrom`, `dateTo`, `baseId`, `equipmentTypeId`, `status`.

### `POST /api/purchases`

```jsonc
// request
{
  "baseId": 47,
  "equipmentTypeId": 62,
  "quantity": 40,
  "purchaseDate": "2026-09-29",
  "supplier": "Meridian Ordnance Corporation",
  "unitPrice": 2150.00
}

// 201
{
  "success": true,
  "message": "Purchase recorded",
  "data": {
    "id": 217,
    "referenceNumber": "PUR-2026-0217",
    "quantity": 40,
    "status": "ACTIVE",
    "equipmentType": { "name": "Assault Rifle", "unitOfMeasure": "weapon" },
    "base": { "name": "Alpha Base" },
    "createdBy": { "name": "Sub. Sanjay Kulkarni" }
  }
}
```

Runs in one transaction: the ledger row, the `RECEIVE` stock movement, and the
audit entry. If any part fails, none of it persists.

| Invalid input | Response |
|---|---|
`quantity: 0` or `-50` | `400` |
Unknown `baseId` or `equipmentTypeId` | `400` |
Future `purchaseDate` | `400` |
Purchase into another base | `403` |
Insufficient permissions | `403` |

### `POST /api/purchases/:id/reverse`

```jsonc
// request
{ "reason": "Duplicate of order HL-2291, raised twice by the depot." }
```

The original is **never deleted**. It is marked `REVERSED`, a matching reversal
row is written pointing back at it, and stock is returned.

Already reversed → `409`.

---

## Transfers — `/api/transfers`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated, scoped to own base |
GET | `/:id` | any authenticated, either end of the transfer |
POST | `/` | any authenticated, from own base |
POST | `/:id/approve` | ADMIN, or BASE_COMMANDER at the source base |
POST | `/:id/reject` | ADMIN, or BASE_COMMANDER at the source base |
POST | `/:id/complete` | ADMIN, or LOGISTICS_OFFICER at the destination base |
POST | `/:id/cancel` | ADMIN, or the initiator |

### Lifecycle

```
  PENDING ──approve──> APPROVED ──complete──> COMPLETED
     │                    │
     ├──reject──> REJECTED
     └──cancel──> CANCELLED <──cancel── (also from APPROVED)
```

**Only `COMPLETED` moves stock.** A pending transfer is a request; treating it as
movement would let anyone freeze inventory by raising transfers they never
intend to complete.

| Illegal transition | Response |
|---|---|
Approve / reject / cancel a `COMPLETED` transfer | `409` |
Complete a `PENDING` transfer | `409` |
Complete the same transfer twice | `409` |

### `POST /api/transfers`

```jsonc
// request
{
  "sourceBaseId": 47,
  "destinationBaseId": 48,
  "equipmentTypeId": 62,
  "quantity": 40
}
```

Source must differ from destination (`400` otherwise). Initiating a transfer
outside your own base returns `403`.

### `POST /api/transfers/:id/approve`

**Four-eyes control:** the initiator cannot approve their own transfer.

```jsonc
// 403
{ "success": false, "message": "A transfer cannot be approved by the person who initiated it", "error": "ApiError" }
```

### `POST /api/transfers/:id/complete`

Only the **destination** base may receive it, since it is the base that has to
verify the equipment physically arrived.

Completion moves both sides inside one transaction:

1. Assert sufficient stock at the source (readable error)
2. Conditional `UPDATE` deducting from source — atomic, cannot race
3. `RECEIVE` at the destination
4. Mark `COMPLETED`
5. Write the audit entry

A transfer that took stock out without recording the arrival would silently
destroy equipment, and no ledger inspection afterwards could detect it.

---

## Assignments — `/api/assignments`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated, scoped |
GET | `/:id` | any authenticated, scoped |
POST | `/` | any authenticated, own base |
POST | `/:id/return` | any authenticated, own base |

### `POST /api/assignments`

```jsonc
// request
{
  "baseId": 47,
  "equipmentTypeId": 62,
  "quantity": 30,
  "personnelName": "Capt. Arjun Rathore",
  "personnelId": "SV-4471",
  "designation": "Platoon Commander",
  "assignmentDate": "2026-09-20"
}
```

Issuing equipment **raises `committed`** and leaves `onHand` untouched, because
the equipment is still at the base — it is simply no longer free to promise to
somebody else.

| Invalid input | Response |
|---|---|
Neither `assetId` nor `equipmentTypeId` | `400` |
`assetId` with `quantity > 1` | `400` |
Quantity exceeding **available** stock | `409` |
Base outside the caller's scope | `403` |

### `POST /api/assignments/:id/return`

```jsonc
{ "returnedQuantity": 12 }
```

Releases `committed` only. **Never touches `onHand`**, because the equipment
never physically left. Partial returns leave the assignment
`PARTIALLY_RETURNED`.

Returning more than was issued → `400`. Returning an already fully returned
assignment → `409`.

---

## Expenditures — `/api/expenditures`

| Method | Path | Roles |
|---|---|---|
GET | `/` | any authenticated, scoped |
GET | `/:id` | any authenticated, scoped |
POST | `/` | ADMIN, BASE_COMMANDER |
POST | `/:id/reverse` | ADMIN |

### `POST /api/expenditures`

```jsonc
// request
{
  "baseId": 47,
  "equipmentTypeId": 62,
  "quantity": 8,
  "expenditureDate": "2026-09-22",
  "reason": "TRAINING",
  "assignmentId": 88,
  "notes": "Consumed during the live fire serial."
}
```

Reasons: `TRAINING`, `DAMAGE`, `LOSS`, `MAINTENANCE`, `OTHER`.

**The `assignmentId` link is the important part.** Equipment issued to a soldier
and then consumed in training has to clear both columns — `onHand` because it is
gone, and `committed` because the obligation is discharged. With the link, one
movement does both. Without it, the same asset is counted twice: once as
missing stock, once as stock still owed back.

| Situation | Response |
|---|---|
Quantity exceeding `onHand` | `409` |
Unlinked write-off when all stock is already committed | `409` |
`assignmentId` from a different base | `400` |
`assignmentId` covering different equipment | `400` |
LOGISTICS_OFFICER attempting it | `403` |

The "already committed" case exists because `committed ≤ onHand` is a database
constraint: an unlinked write-off leaves `committed` untouched, so it may only
draw on *available* stock.

```jsonc
// 409
{
  "success": false,
  "message": "That equipment is already issued to personnel. Link the expenditure to the assignment it was consumed from.",
  "error": "ApiError"
}
```

---

## Dashboard — `/api/dashboard`

| Method | Path | Notes |
|---|---|---|
GET | `/summary` | Headline figures |
GET | `/movements` | Per-equipment-type breakdown |
GET | `/net-movement-details` | Row-level detail behind Net Movement |
GET | `/filters` | Bases and equipment types for the filter controls |

All accept `dateFrom`, `dateTo`, `baseId`, `equipmentTypeId`.

A non-admin is **always** pinned to their own base regardless of the filter
sent.

### `GET /api/dashboard/summary`

```jsonc
// 200
{
  "data": {
    "openingBalance": 271082,
    "purchases": 198178,
    "transferIn": 114129,
    "transferOut": 114129,
    "expended": 21877,
    "assigned": 614,
    "netMovement": 198178,
    "closingBalance": 447383,
    "committedQuantity": 88,
    "available": 447295,
    "filteredByDate": false,
    "note": null
  }
}
```

The equations:

```
Closing balance = opening + purchases + transferIn − transferOut − expenditure
Net movement    = purchases + transferIn − transferOut
Available       = closing balance − committed
```

Two deliberate decisions:

- **The opening balance is never date-filtered.** It is the state entering the
  period; filtering it would silently break the closing equation.
- **`closingBalance` is `null` under a date filter.** Reconstructing stock as at
  a past date is not derivable from movement totals alone. Reporting the current
  figure would be wrong, so it is withheld with an explanation rather than
  invented.

### `GET /api/dashboard/net-movement-details`

Loads the individual movements behind the single Net Movement figure:

```jsonc
{
  "data": {
    "total": 48,
    "truncated": false,
    "netMovement": 312307,
    "rows": [
      {
        "movementType": "TRANSFER",
        "effect": "IN",
        "quantity": 2,
        "date": "2026-09-29T12:04:00.000Z",
        "equipmentType": "Assault Rifle",
        "sourceBase": "Alpha Base",
        "destinationBase": "Charlie Base",
        "reference": "TRF-2026-0407"
      }
    ]
  }
}
```

Capped at 200 rows; `truncated` says so.

---

## Audit Logs — `/api/audit-logs`

| Method | Path | Roles |
|---|---|---|
GET | `/` | ADMIN: everything · BASE_COMMANDER: own base's records · LOGISTICS_OFFICER: own actions |
GET | `/filters` | distinct actions and entity types |
GET | `/:id` | subject to the same scope |

Filters: `action`, `entityType`, `entityId`, `userId`, `dateFrom`, `dateTo`.

The restriction is a **query filter**, not rows hidden in JavaScript.

```jsonc
{
  "data": {
    "createdAt": "2026-09-29T14:22:10.481Z",
    "action": "TRANSFER_COMPLETED",
    "userEmail": "Col. Ishita Bhattacharya",
    "entityType": "Transfer",
    "entityId": "412",
    "method": "POST",
    "endpoint": "/api/transfers/412/complete",
    "ipAddress": "203.0.113.42",
    "requestId": "9f2c1e44-0b71-4c8a-9d33-2a5e8f7b1c10",
    "metadata": { "referenceNumber": "TRF-2026-0412", "quantity": 40 }
  }
}
```

Audit rows are written inside the same transaction as the change they describe.
If the business operation rolls back, so does its audit entry.

Any key matching `password|token|secret|hash|authorization|credential` is
replaced with `[redacted]` before writing.

---

## Health — `/api/health`

Unauthenticated. Runs `SELECT 1`, so it proves the database is genuinely
reachable rather than merely that the process started.

```jsonc
// 200
{
  "success": true,
  "message": "Service is healthy",
  "data": { "status": "ok", "database": "connected", "environment": "production", "uptimeSeconds": 412 }
}
```

Returns `503` with `DATABASE_UNAVAILABLE` when the database cannot be reached.
Stack traces are never included, in any environment, for that response.

---

## Error reference

| Status | `error` | Typical cause |
|---|---|---|
400 | `ApiError` | Validation failed; see `details` |
401 | `ApiError` | Missing, invalid, or expired token |
403 | `ApiError` | Role gate or base scope refusal |
404 | `ApiError` | Not found, **or** outside the caller's base scope |
409 | `ApiError` | Insufficient stock, duplicate code, illegal transition |
429 | `RATE_LIMITED` | Too many login attempts |
500 | `INTERNAL_ERROR` | Unexpected fault; no stack in production |
503 | `DATABASE_UNAVAILABLE` | PostgreSQL unreachable |

A `404` rather than `403` for out-of-scope records is intentional: a `403` would
confirm the record exists, turning the endpoint into a way to probe other bases'
activity by walking ids.
