// Data integrity verification.
//
// Every probe here writes invalid data on purpose and expects the database to
// refuse it. A probe that succeeds means a constraint is missing, so the exit
// code is non-zero when any guard fails to hold.
//
// This is a development tool. It is not wired into server startup, not part of
// the seed flow, and not imported by any application code.
//
// Usage:
//   node scripts/verify-constraints.js
//
// Each probe runs inside its own transaction that is rolled back, so nothing
// this script creates survives. Re-running it is always safe.

import prisma from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

// Thrown at the end of every probe transaction to force a rollback. Carrying a
// sentinel lets the catch block tell an intentional rollback apart from a real
// database error.
const ROLLBACK = Symbol("rollback");

// Runs a probe and reports whether the database rejected the write.
//
// Every probe runs inside its own transaction that is always rolled back, so
// this script can never leave a row behind. That holds for the probes expected
// to succeed as well: they are written, verified, then discarded.
//
// `expectRejection: true` means the database must raise an error.
// `expectRejection: false` means the write is legal at the row level and is
// the responsibility of the service layer to prevent.
async function probe({ name, expectedConstraint, expectRejection, run }) {
  try {
    await prisma.$transaction(async (tx) => {
      await run(tx);
      throw ROLLBACK;
    });

    // Unreachable: the transaction always throws.
    throw new Error("Probe transaction did not roll back as expected.");
  } catch (error) {
    if (error === ROLLBACK) {
      // The write succeeded and has now been discarded.
      if (expectRejection) {
        return {
          name,
          expectedConstraint,
          expectRejection: true,
          outcome: "NOT ENFORCED",
          correct: false,
          detail: "Insert succeeded but the database should have rejected it.",
        };
      }

      return {
        name,
        expectedConstraint: "none at row level",
        expectRejection: false,
        outcome: "ACCEPTED (as designed)",
        correct: true,
        detail: "Row-level rules cannot catch this. Business logic must.",
      };
    }

    if (!expectRejection) {
      return {
        name,
        expectedConstraint,
        expectRejection: false,
        outcome: "WRONGLY REJECTED",
        correct: false,
        detail: `Insert failed but should have been allowed: ${error.message}`,
      };
    }

    // Postgres surfaces a failed CHECK as error class 23 (integrity_constraint).
    // Matching on the constraint name is what proves the right rule fired
    // rather than some unrelated failure happening to reject the row.
    const message = error.message || "";
    const isCheckViolation = error.code === "23514" || message.includes("violates check constraint");
    const namedTheConstraint = message.includes(expectedConstraint);

    return {
      name,
      expectedConstraint,
      expectRejection: true,
      outcome: isCheckViolation ? (namedTheConstraint ? "REJECTED (correct constraint)" : "REJECTED (different constraint)") : "REJECTED (not by a CHECK)",
      correct: isCheckViolation && namedTheConstraint,
      detail: message.split("\n")[0],
    };
  } finally {
    // Nothing is committed, so there is nothing to clean up.
  }
}

async function main() {
  console.log(`Verifying database constraints against ${env.nodeEnv}\n`);

  // Real rows are needed so the foreign keys in the probes resolve.
  const [base] = await prisma.base.findMany({ take: 1 });
  const equipmentType = await prisma.equipmentType.findFirst();

  if (!base || !equipmentType) {
    console.error("Seed data missing. Run `npm run seed` before verifying constraints.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found. Run `npm run seed` before verifying constraints.");
    process.exit(1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = [];

  // 1. A transfer to itself is a no-op and almost always a data entry mistake.
  //    The application rejects this too, but the database must not depend on it.
  results.push(
    await probe({
      name: "Transfer where source and destination are the same base",
      expectedConstraint: "transfers_bases_must_differ",
      expectRejection: true,
      run: (tx) =>
        tx.transfer.create({
          data: {
            referenceNumber: `VC-SAME-${Date.now()}`,
            sourceBaseId: base.id,
            destinationBaseId: base.id,
            equipmentTypeId: equipmentType.id,
            quantity: 1,
            initiatedById: user.id,
          },
        }),
    })
  );

  // 2 and 3. Zero and negative quantities are the two ways a movement can be
  //    meaningless. Both must be impossible at the storage layer.
  results.push(
    await probe({
      name: "Purchase with quantity 0",
      expectedConstraint: "purchases_quantity_positive",
      expectRejection: true,
      run: (tx) =>
        tx.purchase.create({
          data: {
            referenceNumber: `VC-ZERO-${Date.now()}`,
            baseId: base.id,
            equipmentTypeId: equipmentType.id,
            quantity: 0,
            purchaseDate: today,
            createdById: user.id,
          },
        }),
    })
  );

  results.push(
    await probe({
      name: "Purchase with negative quantity",
      expectedConstraint: "purchases_quantity_positive",
      expectRejection: true,
      run: (tx) =>
        tx.purchase.create({
          data: {
            referenceNumber: `VC-NEG-${Date.now()}`,
            baseId: base.id,
            equipmentTypeId: equipmentType.id,
            quantity: -50,
            purchaseDate: today,
            createdById: user.id,
          },
        }),
    })
  );

  // 4. An assignment must say what was issued. Without either an asset or an
  //    equipment type the row describes nothing.
  results.push(
    await probe({
      name: "Assignment with neither assetId nor equipmentTypeId",
      expectedConstraint: "assignments_target_required",
      expectRejection: true,
      run: (tx) =>
        tx.assignment.create({
          data: {
            referenceNumber: `VC-NOTARGET-${Date.now()}`,
            baseId: base.id,
            personnelName: "Integrity Probe",
            quantity: 1,
            assignmentDate: today,
            assignedById: user.id,
          },
        }),
    })
  );

  // 5. Returns cannot exceed what was issued.
  results.push(
    await probe({
      name: "Assignment returning more than was issued",
      expectedConstraint: "assignments_returned_within_quantity",
      expectRejection: true,
      run: (tx) =>
        tx.assignment.create({
          data: {
            referenceNumber: `VC-OVERRETURN-${Date.now()}`,
            baseId: base.id,
            equipmentTypeId: equipmentType.id,
            personnelName: "Integrity Probe",
            quantity: 5,
            returnedQuantity: 9,
            assignmentDate: today,
            assignedById: user.id,
          },
        }),
    })
  );

  // 6. Deliberately NOT expected to be rejected.
  //
  //    A large positive quantity is a valid row. No per-row rule can tell that
  //    the base does not hold stock, because that depends on summing purchases,
  //    transfers, assignments and expenditures across several tables.
  //
  //    Insufficient stock is therefore a business rule, enforced by the
  //    inventory service inside a transaction, not by the database. Seeing this
  //    probe accepted is the point: it shows the boundary between the two
  //    layers is in the right place.
  results.push(
    await probe({
      name: "Expenditure of 99,999,999 rounds (stock sufficiency is a service-layer rule)",
      expectedConstraint: "none at row level",
      expectRejection: false,
      run: (tx) =>
        tx.expenditure.create({
          data: {
            referenceNumber: `VC-HUGE-${Date.now()}`,
            baseId: base.id,
            equipmentTypeId: equipmentType.id,
            quantity: 99999999,
            expenditureDate: today,
            reason: "OTHER",
            recordedById: user.id,
          },
        }),
    })
  );

  // 7. Future-dated records. Allowed by the CHECK with a one day grace period,
  //    and the service layer rejects anything further ahead.
  results.push(
    await probe({
      name: "Purchase dated one year in the future",
      expectedConstraint: "purchases_date_valid",
      expectRejection: true,
      run: (tx) =>
        tx.purchase.create({
          data: {
            referenceNumber: `VC-FUTURE-${Date.now()}`,
            baseId: base.id,
            equipmentTypeId: equipmentType.id,
            quantity: 1,
            purchaseDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            createdById: user.id,
          },
        }),
    })
  );

  console.log("");
  results.forEach((result, index) => {
    const marker = result.correct ? "PASS" : "FAIL";
    console.log(`${index + 1}. [${marker}] ${result.name}`);
    console.log(`     expected: ${result.expectedConstraint}`);
    console.log(`     outcome:  ${result.outcome}`);
    console.log(`     detail:   ${result.detail}`);
    console.log("");
  });

  const failed = results.filter((result) => !result.correct);
  const enforced = results.filter((result) => result.expectRejection && result.correct).length;
  const shouldBeRejected = results.filter((result) => result.expectRejection === true).length;
  const acceptedByDesign = results.filter((result) => result.expectRejection === false).length;

  console.log(`${enforced}/${shouldBeRejected} constraints are actively rejecting invalid data.`);
  console.log(`${acceptedByDesign} probe accepted by design, because no row-level rule can enforce it.`);

  if (failed.length > 0) {
    console.log("\nResult: FAILED");
    console.log("The following probes did not behave as designed:");
    failed.forEach((result) => console.log(`  - ${result.name} (${result.outcome})`));
    console.log("\nIf a constraint is missing, re-apply prisma/migrations/*_add_inventory_constraints.");
    process.exit(1);
  }

  console.log("Result: PASSED");
  console.log("Every database-level rule held, and stock sufficiency was correctly left to the service layer.");
  console.log("No rows were persisted. Probes ran in rolled back transactions.");
}

main()
  .catch((error) => {
    console.error("Verification could not run:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
