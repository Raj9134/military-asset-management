// Restore verification for database/database-dump.sql.
//
// A dump that has never been restored is a claim, not evidence. This restores it
// into a scratch database, then asserts the restored data is complete and that
// the CHECK constraints survived, before comparing the two databases.
//
// Usage:
//   node scripts/verify-restore.js
//
// Requires superuser access to CREATE DATABASE, so run it with the postgres
// account rather than the application role.

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCRATCH_DB = "mams_restore_check";
const DUMP = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "database",
  "database-dump.sql"
);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(stdout) : reject(new Error(stderr || `exit ${code}`))));
  });
}

async function psql(sql, database) {
  const args = ["-U", process.env.PGUSER || "postgres", "-h", "localhost", "-w", "-t", "-A", "-c", sql];
  if (database) args.push("-d", database);
  const output = await run("C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe", args, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD },
  });
  return output.trim();
}

const EXPECTED = {
  bases: 3,
  equipment_types: 4,
  users: 6,
  stock_balances: 12,
  check_constraints: 11,
};

async function main() {
  console.log("Verifying that database/database-dump.sql restores cleanly.\n");

  await psql(`DROP DATABASE IF EXISTS ${SCRATCH_DB};`);
  await psql(`CREATE DATABASE ${SCRATCH_DB};`);
  console.log(`Created scratch database "${SCRATCH_DB}".`);

  const sql = await readFile(DUMP, "utf8");
  console.log(`Restoring ${(sql.length / 1024).toFixed(0)} KB of SQL...`);

  // psql stops on the first error by default only when ON_ERROR_STOP is set, so
  // it is set here: a restore that silently skips a statement is not a restore.
  await run("C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe", [
    "-U", process.env.PGUSER || "postgres", "-h", "localhost", "-w",
    "-v", "ON_ERROR_STOP=1", "-q", "-d", SCRATCH_DB, "-f", DUMP,
  ], { env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD } });

  console.log("Restore completed with no errors.\n");

  const failures = [];
  const check = (label, actual, expected) => {
    const ok = Number(actual) === expected;
    if (!ok) failures.push(`${label}: expected ${expected}, got ${actual}`);
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(22)} ${actual}`);
  };

  console.log("Row counts:");
  for (const [table, expected] of Object.entries(EXPECTED)) {
    if (table === "check_constraints") continue;
    check(table, await psql(`SELECT count(*) FROM "${table}";`, SCRATCH_DB), expected);
  }

  console.log("\nLedger rows (non-zero expected, not fixed):");
  for (const table of ["purchases", "transfers", "assignments", "expenditures", "assets", "audit_logs"]) {
    const count = await psql(`SELECT count(*) FROM "${table}";`, SCRATCH_DB);
    console.log(`  ${Number(count) > 0 ? "PASS" : "FAIL"}  ${table.padEnd(22)} ${count}`);
    if (Number(count) === 0) failures.push(`${table} restored empty`);
  }

  console.log("\nConstraints survived the dump:");
  const constraints = await psql(
    `SELECT count(*) FROM pg_constraint WHERE contype = 'c' AND connamespace = 'public'::regnamespace;`,
    SCRATCH_DB
  );
  check("check constraints", constraints, EXPECTED.check_constraints);

  console.log("\nForeign keys:");
  const fks = await psql(
    `SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace;`,
    SCRATCH_DB
  );
  console.log(`  ${Number(fks) > 0 ? "PASS" : "FAIL"}  foreign keys            ${fks}`);
  if (Number(fks) === 0) failures.push("no foreign keys restored");

  // Prove the restored copy is actually protected, rather than assuming the
  // constraints were merely present in the file.
  //
  // This deliberately does not accept "an error happened" as proof. A syntax
  // error, a missing table or a permission problem would all raise an error too,
  // and treating any of those as success would make this a vacuous check that
  // passes for the wrong reason. It requires all three of:
  //
  //   1. the INSERT reached PostgreSQL and was rejected
  //   2. PostgreSQL reported a CHECK constraint violation (SQLSTATE 23514)
  //   3. the violation names the constraint this probe is meant to exercise
  console.log("\nBehavioural check on the restored copy:");

  const EXPECTED_CONSTRAINT = "transfers_bases_must_differ";

  let insertError = null;
  try {
    await psql(
      `INSERT INTO transfers ("referenceNumber", "sourceBaseId", "destinationBaseId", "equipmentTypeId", quantity, status, "initiatedById", "updatedAt")
       SELECT 'RC-SAME', b.id, b.id, e.id, 1, 'PENDING', u.id, NOW()
       FROM bases b, equipment_types e, users u LIMIT 1;`,
      SCRATCH_DB
    );
  } catch (error) {
    insertError = error;
  }

  if (!insertError) {
    // The insert was accepted, so the restored database is not protected.
    failures.push("restored database ACCEPTED a transfer with identical source and destination");
    console.log("  FAIL  same-base transfer was accepted");
  } else {
    const message = insertError.message || "";

    // 23514 is check_violation. Anything else is a different fault and must not
    // be allowed to masquerade as the constraint working.
    const isCheckViolation = message.includes("23514") || message.includes("violates check constraint");
    const namedTheConstraint = message.includes(EXPECTED_CONSTRAINT);

    if (isCheckViolation && namedTheConstraint) {
      console.log(`  PASS  same-base transfer rejected by ${EXPECTED_CONSTRAINT}`);
    } else if (!isCheckViolation) {
      failures.push(
        `same-base transfer failed for an unrelated reason, not a CHECK constraint: ${message.split("\n")[0]}`
      );
      console.log("  FAIL  rejected by something other than a CHECK constraint");
    } else {
      failures.push(
        `a CHECK constraint fired but not ${EXPECTED_CONSTRAINT}: ${message.split("\n")[0]}`
      );
      console.log("  FAIL  rejected by a different CHECK constraint");
    }
  }

  console.log("");
  if (failures.length > 0) {
    console.log("Result: FAILED");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log("Result: PASSED");
    console.log("The dump restores into a working database with data, constraints and");
    console.log("foreign keys intact, and the constraints are enforced on the restored copy.");
  }

  await psql(`DROP DATABASE IF EXISTS ${SCRATCH_DB};`);
  console.log(`\nDropped scratch database "${SCRATCH_DB}".`);
}

main().catch(async (error) => {
  console.error("Verification could not run:", error.message);
  try { await psql(`DROP DATABASE IF EXISTS ${SCRATCH_DB};`); } catch { /* already gone */ }
  process.exit(1);
});
