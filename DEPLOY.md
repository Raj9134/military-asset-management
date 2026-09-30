# Deployment

Three pieces: a hosted PostgreSQL database, the API on Render, and the
frontend on Vercel or Netlify.

Everything here is reproducible from a fresh checkout. No step bypasses
migrations, authentication, authorization or the inventory transaction layer.

| Component | Target |
|---|---|
| Database | Render PostgreSQL, Neon, or Supabase |
| API | Render web service |
| Frontend | Vercel or Netlify static build |

---

## Order of operations

The API must exist before the frontend, because the frontend is built with the
API URL compiled in.

```
1. Database   →  migrations applied, no schema changes pending
2. API        →  /api/health returns 200
3. Frontend   →  login works
```

---

## 1. Database

### Option A — Render's managed PostgreSQL (used by `render.yaml`)

The blueprint in the repository root creates it automatically:

```bash
render blueprint launch
```

That creates `mams-db` in `singapore`, and a `mams_user` role scoped to it. It
deliberately does **not** use the `postgres` superuser, so a bug is contained to
one database.

### Option B — Neon or Supabase

1. Create a project and a database
2. Copy the **connection string**
3. Make sure it has the **non-pooled** host

> The pooled endpoint routes through PgBouncer in transaction mode. DDL such as
> `CREATE TYPE` cannot run inside it, so `migrate deploy` fails with
> `cannot execute CREATE TYPE in a transaction block` — an error that points
> nowhere near the real cause. Check the host does not contain `-pooler`.
>
> Neon also uses `neon-dev` as the default branch. Whatever branch your URL
> points at is the one migrations will run against. Keep them consistent.

### Apply the migrations

Against the production database:

```bash
cd backend
npx prisma migrate deploy
```

`deploy`, not `dev`. `dev` builds a shadow database and diffs the schema, which
requires elevated permissions a production role should not have. `deploy` just
replays the migrations in order and is a no-op when there is nothing pending.

Expected output:

```
2 migrations found in prisma/migrations
Applying migration `..._init`
Applying migration `..._add_inventory_constraints`
```

---

## 2. API on Render

### With the blueprint

`render.yaml` defines the service. The dashboard reads the blueprint and creates
both resources. One value is marked `sync: false`, so Render prompts for it:

| Variable | Value |
|---|---|
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` — **after** step 3 |

`JWT_SECRET` and `JWT_REFRESH_SECRET` use `generateValue: true`, so Render
creates strong random secrets. The API refuses to start in production if they are
short or identical to each other.

The blueprint also sets `initialDeployHook: npm run seed`, which runs once after
the first successful deploy. That populates the three bases, four equipment
types, opening balances and the six documented demo accounts, so the deployed
system is usable immediately rather than empty.

> `CORS_ORIGIN` has to wait for step 3, because it needs the real frontend URL.
> Set it last and redeploy. The health endpoint works without it, so you can
> verify the API first.

The service's start command runs the migrations and then
`scripts/bootstrap.js`, which seeds the demo data **only if the database has no
users**. That gives a usable system on first boot without any manual step, which
matters on the free tier where Render's interactive Shell is a paid feature and
is therefore unavailable.

Bootstrapping is idempotent by design. A free service is stopped and restarted
constantly, and the demo seed truncates audit logs, assignments, expenditures
and refresh tokens before reinserting, so it must not run unconditionally. The
user-count check means the first boot populates the data and every later boot is
a no-op:

```
Bootstrap: database has no users, seeding demo data...
Bootstrap: demo data seeded.

# on every subsequent cold start
Bootstrap: skipped, 6 user(s) already present.
```

If the seed fails the service still starts, and the deploy log carries the real
error — the alternative would be a crash loop with the cause buried.

> **Demo deploy versus production deploy.** The bootstrap runs the *demo* seed,
> which is what a reviewer signing in at a link needs. For a real production
> deployment, replace `node scripts/bootstrap.js` in the start command with
> `npm run seed:production` and supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` as
> environment variables — see
> [Create the first administrator](#create-the-first-administrator).

### Without the blueprint

Create a web service manually:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci && npm run prisma:generate` |
| Start command | `npx prisma migrate deploy && node src/server.js` |
| Health check path | `/api/health` |

> **Why the full dependency tree is installed.** Prisma CLI is a
> devDependency, and `migrate deploy` needs it. Pruning devDependencies with
> `--omit=dev` removes the CLI before the start command runs, so the deploy
> fails. Installing everything costs a larger image and is worth it for
> reliability.
>
> **Why migrations are chained into the start command.** Render offers
> `preDeployCommand`, but it is restricted to paid plans, and there is no
> `preStartCommand` field at all — a blueprint containing one is rejected during
> review, because the published schema sets `unevaluatedProperties` and refuses
> keys it does not recognise. Chaining with `&&` runs the migration before the
> server accepts traffic, works on the free tier, and is idempotent: with no
> pending migrations `migrate deploy` exits immediately, so a restart or a
> scale-up is safe.
>
> The file is validated against Render's published JSON schema at
> `https://render.com/schema/render.yaml.json`, which is worth doing before any
> blueprint review — the error Render shows is only "a Blueprint file was found,
> but there was an issue", with no indication of which key is at fault.

### Environment variables

Set these in the Render dashboard. None go in a committed file.

```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ random characters>
JWT_REFRESH_SECRET=<different 32+ random characters>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Create the first administrator

Only needed for a production deployment. The blueprint's `initialDeployHook`
already seeds the demo accounts for a review deployment.

For production, do **not** run `npm run seed`. It creates six accounts with a
shared demo password and sixty days of fabricated movements. Use the production
bootstrap instead:

```bash
cd backend
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD='a-strong-password' \
npm run seed:production
```

It creates only what the system cannot run without:

```
  3 bases
  4 equipment types
  12 stock balances, all zero
  1 administrator from ADMIN_EMAIL

Production bootstrap complete: {
  bases: 3, equipmentTypes: 4, users: 1,
  purchases: 0, transfers: 0, assignments: 0, expenditures: 0
}

No movement history was created. Every figure in this database
came from a user action.
```

It is idempotent and will not reset an existing administrator's password.

> On Render, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables
> and run `npm run seed:production` as a one-off deploy command, or locally
> against the hosted `DATABASE_URL`. The free tier has no interactive shell, so
> the dashboard's shell is not an option there.

### Verify

```bash
curl https://mams-asset-api.onrender.com/api/health
```

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "connected",
    "environment": "production"
  }
}
```

---

## 3. Frontend

### Vercel

```bash
cd frontend
npm install
npx vercel --prod
```

Or import the repository and set:

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Add one environment variable:

```
VITE_API_URL=https://mams-asset-api.onrender.com/api
```

`vercel.json` is committed and handles the rest: the SPA rewrite, immutable
caching for hashed assets, `no-cache` on `index.html`, and the standard security
headers.

> **The rewrite is not optional.** The app uses client-side routing, so
> `/dashboard` is a real URL with no corresponding file in `dist`. Without
> `{ "source": "/(.*)", "destination": "/index.html" }`, refreshing that page or
> opening a bookmark returns 404 while clicking links works fine.

> `VITE_API_URL` is compiled into the bundle at build time. Changing it later
> requires a rebuild and redeploy.

### Netlify

```bash
cd frontend
npm run build
npx netlify deploy --prod --dir=dist
```

Or import the repository. `netlify.toml` and `public/_redirects` are committed
and contain the same rewrite and headers.

---

## 4. Finish CORS

Now that the frontend URL exists, set it on the API:

```
CORS_ORIGIN=https://your-frontend.vercel.app
```

Save and redeploy. The API reads it at boot into an allow-list.

---

## 5. Verify the deployment

Do not assume local success means deployed success. Work through this list
against the live URLs.

**Health**
```bash
curl https://mams-asset-api.onrender.com/api/health          # 200, database connected
```

**Authentication**
- Sign in as `admin@mams.local` / `Passw0rd@2026` (the blueprint's deploy hook
  seeds the demo accounts) — or with `ADMIN_EMAIL` / `ADMIN_PASSWORD` if you
  bootstrapped production by hand
- Wrong password → 401 with a generic message
- Sign out → the session ends

**Authorization**
- Create a base commander at Alpha Base, sign in as them
- Navigation shows no Users, Bases or Equipment Types
- Typing `https://your-frontend.vercel.app/users` → redirected to /forbidden
- Calling the API with their own valid token → 403

**Inventory, in the live UI**
- Record a purchase → the dashboard closing balance rises by that quantity
- Issue equipment → *Available* falls, *Closing* unchanged
- Record an expenditure against that assignment → both fall by exactly that
  quantity

**Cross-base**
- Alpha's commander requests `?baseId=<Bravo id>` → 403
- Alpha's commander reads a Bravo purchase by id → 404

**Consistency**
- Every dashboard figure matches the equation
- The Audit Logs screen shows the actions just performed

**Database**
```bash
# Locally, against the hosted URL
npm run verify:inventory      # must say "No drift"
```

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `cannot execute CREATE TYPE in a transaction block` | Pooled connection string. Remove `-pooler` from the host |
| `P1000 authentication failed` | Wrong `DATABASE_URL`, credentials, or IP allow-list on the provider |
| `Refusing to start: JWT secrets must be long` | Production guard. Generate two different 32+ character secrets |
| Health returns 503 `DATABASE_UNAVAILABLE` | The API cannot reach PostgreSQL. Check the URL and provider allow-list |
| Login works, every other call is 403 | `CORS_ORIGIN` does not match the frontend origin exactly |
| Frontend 404 on refresh | Missing SPA rewrite. Confirm `vercel.json` or `_redirects` was picked up |
| `prisma: command not found` during deploy | `--omit=dev` removed the CLI. Use `npm ci` without it |
| First Render start is slow | The free tier sleeps. The first request after idle can take ~30s |
| Migrations did not run | Check the Render build log for the pre-start command |

---

## Rollback

The schema only ever moves forward, so rolling back application code after a
migration may need a forward migration to restore expected shape.

```bash
cd backend
npx prisma migrate status     # what is applied
npx prisma migrate deploy     # apply anything pending
```

To restore the demo dataset locally:

```bash
psql -d mams -f database/database-dump.sql
```

That dump is the development dataset with demo data. It is **not** what belongs
in production, which is why the production bootstrap exists.
