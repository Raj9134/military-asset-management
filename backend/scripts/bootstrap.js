// One-shot bootstrap for a deployed instance.
//
// Render's interactive Shell is a paid feature, so a free-tier deployment has
// no way to run the seed by hand. This runs as part of the start command
// instead, and is deliberately conditional:
//
//   if the database already has users -> do nothing and exit 0
//   if it is empty                    -> run the demo seed
//
// That matters because a free service is stopped and restarted constantly, and
// the demo seed truncates audit logs, assignments, expenditures and refresh
// tokens before reinserting. Running it unconditionally on every boot would
// wipe anything a reviewer had done. Gating on an empty database means the
// first boot populates the demo data and every later boot is a no-op.
//
// A seed failure is reported but does not stop the server booting: exiting
// non-zero here would put the service into a crash loop, and the deploy log is
// where the real error needs to surface.
import { spawnSync } from "node:child_process";
import { prisma } from "../src/config/prisma.js";

try {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log(`Bootstrap: skipped, ${userCount} user(s) already present.`);
  } else {
    console.log("Bootstrap: database has no users, seeding demo data...");
    const seed = spawnSync(process.execPath, ["prisma/seed.js"], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    if (seed.status === 0) {
      console.log("Bootstrap: demo data seeded.");
    } else {
      console.error(
        `Bootstrap: the demo seed exited with status ${seed.status}. The service will still ` +
          "start, but the database may be empty. Check the deploy log for the seed's own error."
      );
    }
  }
} catch (error) {
  console.error(`Bootstrap: could not inspect the database: ${error.message}`);
  console.error("The service will still start. Check the deploy log.");
} finally {
  await prisma.$disconnect();
}
