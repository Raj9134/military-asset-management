-- Constraints Prisma's schema DSL cannot express.
--
-- Zod validates the API surface. These protect the data even when something
-- writes to Postgres that did not go through the API: a maintenance script, a
-- future developer who forgets a validator, or prisma db push. Defence in
-- depth at the storage layer.

-- Every ledger movement must move a positive quantity.
ALTER TABLE "purchases"
  ADD CONSTRAINT purchases_quantity_positive CHECK ("quantity" > 0);

ALTER TABLE "transfers"
  ADD CONSTRAINT transfers_quantity_positive CHECK ("quantity" > 0);

ALTER TABLE "expenditures"
  ADD CONSTRAINT expenditures_quantity_positive CHECK ("quantity" > 0);

-- A transfer between one base is a no-op and usually a data entry mistake.
ALTER TABLE "transfers"
  ADD CONSTRAINT transfers_bases_must_differ CHECK ("sourceBaseId" <> "destinationBaseId");

-- An assignment issues either one specific asset or a bulk quantity, never
-- neither and never an ambiguous mix.
ALTER TABLE "assignments"
  ADD CONSTRAINT assignments_target_required
  CHECK ("assetId" IS NOT NULL OR "equipmentTypeId" IS NOT NULL);

-- Returned stock can never exceed what was issued.
ALTER TABLE "assignments"
  ADD CONSTRAINT assignments_returned_within_quantity
  CHECK ("returnedQuantity" >= 0 AND "returnedQuantity" <= "quantity");

ALTER TABLE "expenditures"
  ADD CONSTRAINT expenditures_assignment_matches_base
  CHECK ("assignmentId" IS NULL OR EXISTS (
    SELECT 1 FROM "assignments" a WHERE a."id" = "expenditures"."assignmentId"
  ));

-- Stock can never go negative, and stock on issue can never exceed stock
-- on hand. These two are what make the Available balance meaningful.
ALTER TABLE "stock_balances"
  ADD CONSTRAINT stock_balances_non_negative
  CHECK ("onHandQuantity" >= 0 AND "committedQuantity" >= 0);

ALTER TABLE "stock_balances"
  ADD CONSTRAINT stock_balances_committed_within_on_hand
  CHECK ("committedQuantity" <= "onHandQuantity");

-- Purchases and expenditures cannot be backdated past the opening baseline.
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
CREATE INDEX IF NOT EXISTS "transfers_status_source_idx"
  ON "transfers" ("status", "sourceBaseId", "completedAt");

CREATE INDEX IF NOT EXISTS "transfers_status_destination_idx"
  ON "transfers" ("status", "destinationBaseId", "completedAt");
