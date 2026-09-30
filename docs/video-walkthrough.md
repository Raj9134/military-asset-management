# Video Walkthrough Script

Target length **4 minutes 30 seconds**. Every line below describes something the
application actually does. Where a command is shown, the expected output is real
output from this build.

Speak conversationally. This is a walkthrough, not a presentation.

---

## 0:00 – 0:25 — Introduction

> "This is a Military Asset Management System, built with Node, Express and
> PostgreSQL on the back end and React on the front. It manages the movement,
> assignment, purchase and expenditure of equipment across multiple bases.
>
> The problem it solves is that spreadsheets can't hold history. A cell that used
> to say 500 and now says 480 gives no idea whether 20 were consumed, transferred
> out, or mistyped. Here, nothing is ever overwritten — every movement is
> appended, and the current balance is derived from that history."

---

## 0:25 – 0:50 — Architecture

> "Three layers. React on the front talking REST to an Express API, which talks
> Prisma to PostgreSQL.
>
> On the back end the pattern is strict: routes, then controllers that only parse
> the request and shape the response, then services that hold the business rules
> and the database transactions. Controllers never touch the database and
> services never touch the HTTP objects. That boundary is what makes the business
> rules testable without running a server.
>
> Every write that moves inventory runs inside a single transaction covering the
> movement record, the stock change, and the audit entry. If any part fails,
> none of it survives."

*[Show `backend/src/app.js` briefly, then the folder layout.]*

---

## 0:50 – 1:20 — Login and roles

> "Let me sign in as a Base Commander."

*[Sign in with `commander.alpha@mams.local`.]*

> "Notice the sidebar — Dashboard, Purchases, Transfers, Assignments and
> Expenditures, Audit Logs. No Users, no Bases, no Equipment Types. Those are
> admin-only.
>
> But hiding a button is not security. Let me show that the backend refuses it
> independently."

*[Pause. Open the browser console or show the terminal curl.]*

```
GET /api/users
→ 403 This action requires one of the following roles: ADMIN
```

> "That's with my own valid token, not a forged one. The frontend and the backend
> are two independent layers, and only the second one is a control."

*[Type `/users` into the address bar — it redirects to a "Not available for your
role" page.]*

> "Even typing the URL directly gets redirected."

---

## 1:20 – 1:50 — Dashboard

> "This is the dashboard, scoped to Alpha Base. Every number came from a SQL
> aggregate on the server — nothing is calculated in the browser, and no balance
> is a stored total someone can edit.
>
> The equation is closing balance equals opening, plus purchases, plus transfer
> in, minus transfer out, minus expenditure. That's printed right there on the
> table header, and the API asserts the same relationship in its test suite.
>
> One thing that's deliberately absent: assignments. Issuing equipment doesn't
> remove it from the base, so it isn't in the closing balance."

*[Click the Net Movement card.]*

> "A single number hides how it was reached, so clicking it opens the individual
> movements — quantity, date, equipment type, both bases, and the transaction
> reference. It's a separate API call, not assembled from what's already on
> screen."

---

## 1:50 – 2:15 — Purchase

> "Let me record a purchase. Alpha Base, forty assault rifles."

*[Open Purchases, click Record purchase, fill the form, submit.]*

> "The new row appears immediately with a reference number, the supplier, and
> who's recorded it. Back on the dashboard, closing balance has gone up by exactly
> forty."

*[Point at the closing balance figure.]*

> "That's a database transaction, not a UI update. Three writes happened together:
> the ledger row, the stock movement, and the audit entry. If the audit write
> had failed, the whole thing would have rolled back."

---

## 2:15 – 2:50 — Transfer

> "Transfers move equipment between bases, and they have a lifecycle:
> pending, approved, completed — or rejected or cancelled."

*[Show the Transfers list — note the mixture of statuses.]*

> "Only completed transfers move stock. A pending transfer is a request. If
> pending ones counted, anyone could freeze inventory just by raising transfers
> they never intend to finish.
>
> There's also a four-eyes rule: a transfer can't be approved by the person who
> raised it."

*[Open a transfer's action dialog.]*

> "And completion is the receiving base's job, not the sender's — because it's
> the base that has to actually verify the equipment arrived. It moves both sides
> in one transaction."

---

## 2:50 – 3:15 — Assignment and expenditure

> "This is the part I found most interesting to design.
>
> Issuing equipment doesn't remove it from the base — the rifles are still in the
> stores, they're just not free to promise to anyone else. So the system tracks
> two quantities per base and equipment type: what's physically on hand, and what's
> committed to personnel. Available is the difference.
>
> So when I issue thirty rifles, closing balance stays the same and available
> drops by thirty."

*[Show Assignments, issue equipment, then check the dashboard figures.]*

> "Now if some of that issued equipment is expended in training, it has to clear
> both — it's gone, and the obligation is discharged. That's one movement, and
> it's why Expenditure has an optional link to the assignment it came from.
>
> Without that link the same rifle gets counted twice: once as missing stock, and
> once as stock still owed back."

---

## 3:15 – 3:40 — Audit log

> "Every one of those actions wrote an audit entry."

*[Show the Audit Logs screen.]*

> "Who did it, what record, which endpoint, from which address, and a request id
> that ties the log to the specific call.
>
> Two things worth noting. The audit entry is written in the same transaction as
> the change it describes, so the log can never claim something happened that got
> rolled back. And anything that looks like a credential gets redacted before it's
> written, centrally, rather than relying on each call site to remember."

---

## 3:40 – 4:15 — The tricky part: proving the cache is right

> "I keep a cached balance for fast reads, and that's the kind of thing that
> quietly drifts out of sync. So there's a script that rebuilds every balance from
> the movement ledger and compares."

*[Terminal:]*

```
npm run verify:inventory

No drift. All 12 stock balances match the ledger.
```

> "That runs after the seed, and again after all the API mutations we just did.
> The second run is the one that matters — it proves the cache still agrees with
> history written through real transactions.
>
> There's a second check at the database level."

```
npm run verify:constraints

6/6 constraints are actively rejecting invalid data.
1 probe accepted by design, because no row-level rule can enforce it.
```

> "Six of those probes deliberately try to write invalid data — a transfer where
> source equals destination, a purchase of zero or negative quantity, an
> assignment with no target — and each is rejected by the specific constraint that
> should catch it. The seventh is expected to succeed, because whether a base
> holds enough stock isn't a per-row rule; it depends on the whole ledger. That
> boundary is deliberate.
>
> And the stock check itself is a conditional update, so the guard is in the
> where clause rather than in JavaScript — PostgreSQL decides, not the
> application. Two simultaneous requests for the last ten rifles can't both
> succeed."

---

## 4:15 – 4:30 — Testing

> "Seventy-five backend tests across eleven suites, all passing, covering
> authentication, RBAC, cross-base denial, the transfer lifecycle, the inventory
> rules, the dashboard arithmetic, and the audit trail."

```
npm test

# tests 75
# suites 11
# pass 75
# fail 0
```

> "Those tests earned their keep. They found that login was sitting behind the
> authentication guard — nobody could have signed in — and that the reference
> column was three characters too short for its own placeholder, which broke
> every single write. Both built cleanly. Neither worked."

---

## 4:30 – 4:45 — Closing

> "To summarise: the inventory is derived from an append-only ledger and verified
> against it; authorization is enforced on the server as a query filter, not a
> hidden button; and every significant action is attributable.
>
> Everything here is fictional demo data. There's also a database dump, restore
> instructions, and full API documentation in the repository. Thanks."

---

## Cutdowns

If time is short, the two segments to protect are **1:50–2:15** (a purchase
visibly changing stock) and **2:50–3:15** (the two-quantity model), since those
are the parts that are hard to infer from the code.

To reach three minutes, drop the purchase segment and the constraints segment.

---

## Recording notes

- Show the real application, not slides. The figures quoted above are from this
  build and will differ after a reseed.
- The terminal segments are pre-recorded if you prefer, or run them live.
- Do **not** claim a hosted deployment. The deployment configuration is prepared
  and validated, but the services are not live — that needs the platform
  accounts.
- Narration says "seventy-five tests, all passing" because that is what
  `npm test` prints. If the count changes, update this script.
