// Production bootstrap.
//
// The demo seed creates six shared-password accounts and sixty days of
// fabricated movements. None of that belongs in a production database, so this
// script creates only what the system cannot run without:
//
//   * the three bases
//   * the four equipment types
//   * one administrator, read from environment variables
//
// It writes no movement history, so every purchase, transfer, assignment and
// expenditure in a production database came from a real user action.
//
// Run once, from a shell that has DATABASE_URL, ADMIN_EMAIL and
// ADMIN_PASSWORD set:
//
//   npm run seed:production
//
// Idempotent: re-running updates the master data and leaves existing rows
// alone. It will not reset the administrator's password if the account exists,
// because that would silently lock out whoever deployed it.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BASES = [
  { code: "ALPHA", name: "Alpha Base", location: "Northern Command, Sector 4", description: "Primary training and vehicle holding base." },
  { code: "BRAVO", name: "Bravo Base", location: "Eastern Command, Airfield Station", description: "Forward operating base with airlift support." },
  { code: "CHARLIE", name: "Charlie Base", location: "Southern Command, Coastal Depot", description: "Main logistics depot and ammunition storage." },
];

const EQUIPMENT_TYPES = [
  { code: "PATROL_VEH", name: "Patrol Vehicle", category: "VEHICLE", unitOfMeasure: "vehicle", isTrackable: true, description: "Four-wheel patrol vehicle, individually serialised." },
  { code: "ASSAULT_RIFLE", name: "Assault Rifle", category: "WEAPON", unitOfMeasure: "weapon", isTrackable: true, description: "Service rifle, individually serialised." },
  { code: "AMMO_556", name: "5.56mm Ammunition", category: "AMMUNITION", unitOfMeasure: "round", isTrackable: false, description: "Bulk quantity issue, tracked by count only." },
  { code: "RADIO_SET", name: "Field Radio Set", category: "OTHER", unitOfMeasure: "set", isTrackable: true, description: "Manpack radio set, individually serialised." },
];

// Stock balances are created empty. Opening quantities are a business decision
// for whoever owns the deployment, not something this script should invent.
const OPENING_DATE = new Date(new Date().setHours(0, 0, 0, 0));

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
    console.error("Generate a password with:");
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(24).toString(\'base64url\'))"');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  console.log("Bootstrapping production master data...\n");

  for (const row of BASES) {
    await prisma.base.upsert({
      where: { code: row.code },
      update: { name: row.name, location: row.location, description: row.description },
      create: row,
    });
  }
  console.log(`  ${BASES.length} bases`);

  const equipment = [];
  for (const row of EQUIPMENT_TYPES) {
    equipment.push(
      await prisma.equipmentType.upsert({
        where: { code: row.code },
        update: {
          name: row.name,
          category: row.category,
          unitOfMeasure: row.unitOfMeasure,
          isTrackable: row.isTrackable,
          description: row.description,
        },
        create: row,
      })
    );
  }
  console.log(`  ${EQUIPMENT_TYPES.length} equipment types`);

  // An empty balance per base and type, so a stock check has a row to read
  // rather than a missing one.
  const bases = await prisma.base.findMany();
  let balances = 0;
  for (const base of bases) {
    for (const item of equipment) {
      await prisma.stockBalance.upsert({
        where: { stock_balance_base_equipment_key: { baseId: base.id, equipmentTypeId: item.id } },
        update: {},
        create: {
          baseId: base.id,
          equipmentTypeId: item.id,
          openingQuantity: 0,
          openingDate: OPENING_DATE,
          onHandQuantity: 0,
          committedQuantity: 0,
        },
      });
      balances += 1;
    }
  }
  console.log(`  ${balances} stock balances, all zero`);

  const existing = await prisma.user.findUnique({ where: { email } });
  let admin;

  if (existing) {
    console.log(`\n  administrator ${email} already exists, leaving it unchanged`);
    admin = existing;
  } else {
    admin = await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || "System Administrator",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "ADMIN",
        baseId: null,
        isActive: true,
      },
      select: { id: true, email: true, role: true },
    });
    console.log(`\n  created administrator ${admin.email}`);
  }

  const counts = {
    bases: await prisma.base.count(),
    equipmentTypes: await prisma.equipmentType.count(),
    users: await prisma.user.count(),
    purchases: await prisma.purchase.count(),
    transfers: await prisma.transfer.count(),
    assignments: await prisma.assignment.count(),
    expenditures: await prisma.expenditure.count(),
  };

  console.log("\nProduction bootstrap complete:", counts);

  if (counts.purchases || counts.transfers || counts.assignments || counts.expenditures) {
    console.log("\nExisting movement history was preserved, as expected.");
  } else {
    console.log("\nNo movement history was created. Every figure in this database");
    console.log("came from a user action.");
  }

  console.log("\nSign in at the deployed frontend with the ADMIN_EMAIL you supplied.");
}

main()
  .catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
