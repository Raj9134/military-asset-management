-- Inventory constraints.
--
-- Prisma's schema language cannot express CHECK constraints, so they live here
-- as hand-written SQL. Zod already rejects this data at the API boundary; these
-- rules hold even when something writes to Postgres without going through the
-- API, such as a maintenance script, or a future developer who forgets a
-- validator. Defence in depth at the storage layer.
--
-- Note: a CHECK constraint must not contain a subquery, so cross-table rules
-- are deliberately absent here. That a referenced assignment belongs to the
-- same base is enforced by expenditureService, which has to query anyway.

-- Every ledger movement must move a positive quantity.
ALTER TABLE "purchases"
  ADD CONSTRAINT purchases_quantity_positive CHECK ("quantity" > 0);

ALTER TABLE "transfers"
  ADD CONSTRAINT transfers_quantity_positive CHECK ("quantity" > 0);

ALTER TABLE "expenditures"
  ADD CONSTRAINT expenditures_quantity_positive CHECK ("quantity" > 0);

-- A transfer to itself is a no-op and almost always a data entry mistake.
ALTER TABLE "transfers"
  ADD CONSTRAINT transfers_bases_must_differ CHECK ("sourceBaseId" <> "destinationBaseId");

-- An assignment must say what was issued: either a specific serialised asset or
-- a bulk quantity of an equipment type. Without both being absent the row would
-- describe nothing.
ALTER TABLE "assignments"
  ADD CONSTRAINT assignments_target_required
  CHECK ("assetId" IS NOT NULL OR "equipmentTypeId" IS NOT NULL);

-- Returned stock can never exceed what was issued.
ALTER TABLE "assignments"
  ADD CONSTRAINT assignments_returned_within_quantity
  CHECK ("returnedQuantity" >= 0 AND "returnedQuantity" <= "quantity");

-- Stock can never go negative, and stock on issue can never exceed stock on
-- hand. These two are what make the Available balance meaningful.
ALTER TABLE "stock_balances"
  ADD CONSTRAINT stock_balances_non_negative
  CHECK ("onHandQuantity" >= 0 AND "committedQuantity" >= 0);

ALTER TABLE "stock_balances"
  ADD CONSTRAINT stock_balances_committed_within_on_hand
  CHECK ("committedQuantity" <= "onHandQuantity");

-- Movements cannot be backdated into the future. A one day grace period absorbs
-- time zone differences between the client and the server.
ALTER TABLE "purchases"
  ADD CONSTRAINT purchases_date_valid
  CHECK ("purchaseDate" IS NOT NULL AND "purchaseDate" <= CURRENT_DATE + INTERVAL '1 day');

ALTER TABLE "expenditures"
  ADD CONSTRAINT expenditures_date_valid
  CHECK ("expenditureDate" IS NOT NULL AND "expenditureDate" <= CURRENT_DATE + INTERVAL '1 day');

ALTER TABLE "assignments"
  ADD CONSTRAINT assignments_date_valid
  CHECK ("assignmentDate" IS NOT NULL AND "assignmentDate" <= CURRENT_DATE + INTERVAL '1 day');

-- Supports the dashboard's transfer aggregation, which filters on status and
-- then groups by source or destination base.
CREATE INDEX "transfers_status_source_idx"
  ON "transfers" ("status", "sourceBaseId", "completedAt");

CREATE INDEX "transfers_status_destination_idx"
  ON "transfers" ("status", "destinationBaseId", "completedAt");
