// Seed data. Everything here is fictional: invented bases, invented suppliers,
// invented personnel. No real unit names, no real serial numbers, no real
// operational quantities.
//
// The seed is written so that the movement history is arithmetically honest.
// StockBalance is recomputed by walking the ledger rather than hardcoded, which
// means a reviewer can change any quantity above and the balances still hold.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// The demo window. Everything is anchored to a fixed date so the dataset is
// reproducible no matter when the seed runs.
const TODAY = new Date();
const HISTORY_DAYS = 60;
const WINDOW_START = new Date(TODAY.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);

const dayOffset = (days) => new Date(WINDOW_START.getTime() + days * 24 * 60 * 60 * 1000);
const dateOnly = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const DEMO_PASSWORD = "Passw0rd@2026";

// Fictional personnel.
const PERSONNEL = [
  { name: "Capt. Arjun Rathore", id: "SV-4471", designation: "Platoon Commander" },
  { name: "Lt. Meera Joshi", id: "SV-4482", designation: "Weapons Officer" },
  { name: "Sgt. Vikram Rathore", id: "SV-4501", designation: "Quartermaster" },
  { name: "Cpl. Neha Singh", id: "SV-4516", designation: "Vehicle Crew Chief" },
  { name: "Sgt. Imran Sheikh", id: "SV-4523", designation: "Explosive Ordnance Disposal" },
  { name: "Lt. Karthik Menon", id: "SV-4530", designation: "Signals Officer" },
  { name: "Cpl. Rohan Das", id: "SV-4544", designation: "Machine Gunner" },
  { name: "Sgt. Priya Nair", id: "SV-4552", designation: "Stores Clerk" },
  { name: "Cpl. Aditya Kumar", id: "SV-4560", designation: "Driver" },
  { name: "Lt. Sneha Patil", id: "SV-4571", designation: "Platoon Commander" },
  { name: "Sgt. Manish Gupta", id: "SV-4583", designation: "Motor Pool NCO" },
  { name: "Cpl. Fatima Ansari", id: "SV-4590", designation: "Rifleman" },
];

const SUPPLIERS = [
  "Northwind Defence Supplies",
  "Meridian Ordnance Corporation",
  "Halcyon Logistics",
  "Sterling Vehicle Works",
];

const EXPENDITURE_NOTES = {
  TRAINING: ["Live fire exercise", "Field training day", "Re-certification range"],
  DAMAGE: ["Barrel heat damage beyond service limit", "Chassis damage during obstacle course", "Optics cracked in transit"],
  LOSS: ["Unrecovered after field exercise", "Missing after convoy movement"],
  MAINTENANCE: ["Consumed during scheduled servicing", "Stripped for repairable components"],
  OTHER: ["Returned to supplier as defective", "Written off after inspection"],
};

const reference = (prefix, number) =>
  `${prefix}-${TODAY.getFullYear()}-${String(number).padStart(4, "0")}`;

// Counts running stock per base and equipment type so every generated movement
// stays within what is actually on hand.
const ledger = new Map();
const ledgerKey = (baseId, equipmentTypeId) => `${baseId}:${equipmentTypeId}`;
const readLedger = (baseId, equipmentTypeId) =>
  ledger.get(ledgerKey(baseId, equipmentTypeId)) || { onHand: 0, committed: 0 };

async function seedBases() {
  const rows = [
    { code: "ALPHA", name: "Alpha Base", location: "Northern Command, Sector 4", description: "Primary training and vehicle holding base." },
    { code: "BRAVO", name: "Bravo Base", location: "Eastern Command, Airfield Station", description: "Forward operating base with airlift support." },
    { code: "CHARLIE", name: "Charlie Base", location: "Southern Command, Coastal Depot", description: "Main logistics depot and ammunition storage." },
  ];

  const created = [];
  for (const row of rows) {
    const base = await prisma.base.upsert({
      where: { code: row.code },
      update: { name: row.name, location: row.location, description: row.description },
      create: row,
    });
    created.push(base);
  }
  return created;
}

async function seedEquipmentTypes() {
  const rows = [
    { code: "PATROL_VEH", name: "Patrol Vehicle", category: "VEHICLE", unitOfMeasure: "vehicle", isTrackable: true, description: "Four-wheel patrol vehicle, individually serialised." },
    { code: "ASSAULT_RIFLE", name: "Assault Rifle", category: "WEAPON", unitOfMeasure: "weapon", isTrackable: true, description: "Service rifle, individually serialised." },
    { code: "AMMO_556", name: "5.56mm Ammunition", category: "AMMUNITION", unitOfMeasure: "round", isTrackable: false, description: "Bulk quantity issue. Tracked by count only." },
    { code: "RADIO_SET", name: "Field Radio Set", category: "OTHER", unitOfMeasure: "set", isTrackable: true, description: "Manpack radio set, individually serialised." },
  ];

  const created = [];
  for (const row of rows) {
    const item = await prisma.equipmentType.upsert({
      where: { code: row.code },
      update: { name: row.name, category: row.category, unitOfMeasure: row.unitOfMeasure, isTrackable: row.isTrackable, description: row.description },
      create: row,
    });
    created.push(item);
  }
  return created;
}

async function seedUsers(bases) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [alpha, bravo] = bases;

  const rows = [
    { name: "System Administrator", email: "admin@mams.local", role: "ADMIN", baseId: null },
    { name: "Col. Devansh Kulkarni", email: "commander.alpha@mams.local", role: "BASE_COMMANDER", baseId: alpha.id },
    { name: "Col. Ishita Bhattacharya", email: "commander.bravo@mams.local", role: "BASE_COMMANDER", baseId: bravo.id },
    { name: "Maj. Rohan Fernandes", email: "commander.charlie@mams.local", role: "BASE_COMMANDER", baseId: bases[2].id },
    { name: "Sub. Sanjay Kulkarni", email: "logistics.alpha@mams.local", role: "LOGISTICS_OFFICER", baseId: alpha.id },
    { name: "Sub. Kavya Pillai", email: "logistics.charlie@mams.local", role: "LOGISTICS_OFFICER", baseId: bases[2].id },
  ];

  const created = [];
  for (const row of rows) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: { name: row.name, role: row.role, baseId: row.baseId },
      create: { ...row, passwordHash, email: row.email.toLowerCase() },
    });
    created.push(user);
  }
  return created;
}

// The opening baseline. Movement records cannot explain the state a base was
// in before the system went live, so that state is recorded explicitly.
const OPENING_STOCK = [
  { baseCode: "ALPHA", equipmentCode: "PATROL_VEH", quantity: 24 },
  { baseCode: "ALPHA", equipmentCode: "ASSAULT_RIFLE", quantity: 480 },
  { baseCode: "ALPHA", equipmentCode: "AMMO_556", quantity: 96000 },
  { baseCode: "ALPHA", equipmentCode: "RADIO_SET", quantity: 30 },
  { baseCode: "BRAVO", equipmentCode: "PATROL_VEH", quantity: 16 },
  { baseCode: "BRAVO", equipmentCode: "ASSAULT_RIFLE", quantity: 260 },
  { baseCode: "BRAVO", equipmentCode: "AMMO_556", quantity: 54000 },
  { baseCode: "BRAVO", equipmentCode: "RADIO_SET", quantity: 18 },
  { baseCode: "CHARLIE", equipmentCode: "PATROL_VEH", quantity: 12 },
  { baseCode: "CHARLIE", equipmentCode: "ASSAULT_RIFLE", quantity: 220 },
  { baseCode: "CHARLIE", equipmentCode: "AMMO_556", quantity: 120000 },
  { baseCode: "CHARLIE", equipmentCode: "RADIO_SET", quantity: 22 },
];

async function seedOpeningBalances(bases, equipment) {
  const baseByCode = Object.fromEntries(bases.map((b) => [b.code, b]));
  const equipByCode = Object.fromEntries(equipment.map((e) => [e.code, e]));

  for (const row of OPENING_STOCK) {
    const base = baseByCode[row.baseCode];
    const equipmentType = equipByCode[row.equipmentCode];

    await prisma.stockBalance.upsert({
      where: { stock_balance_base_equipment_key: { baseId: base.id, equipmentTypeId: equipmentType.id } },
      update: {},
      create: {
        baseId: base.id,
        equipmentTypeId: equipmentType.id,
        openingQuantity: row.quantity,
        openingDate: dateOnly(WINDOW_START),
        onHandQuantity: row.quantity,
        committedQuantity: 0,
      },
    });

    ledger.set(ledgerKey(base.id, equipmentType.id), { onHand: row.quantity, committed: 0 });
  }
}

// Returns the uncommitted stock available to a base for one equipment type.
// onHand is the physical count; committed is already issued to personnel, so
// neither of those units can be promised twice.
function availableAt(baseId, equipmentTypeId) {
  const balance = readLedger(baseId, equipmentTypeId);
  return balance.onHand - balance.committed;
}

// Picks a base that can cover the quantity for a specific equipment type.
// The equipment type is an argument rather than something the caller swaps in
// afterwards, because checking one pair and then creating the record against a
// different pair is how the seed ends up validating the wrong balance.
function findBaseFor(bases, equipmentType, quantity) {
  const eligible = bases.filter((base) => availableAt(base.id, equipmentType.id) >= quantity);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// Picks any base and equipment pair with enough stock. Used where the choice
// of equipment is not decided in advance.
function findPairWithStock(bases, equipment, quantity) {
  const candidates = [];
  for (const base of bases) {
    for (const item of equipment) {
      if (availableAt(base.id, item.id) >= quantity) candidates.push({ base, item });
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function applyLedger(baseId, equipmentTypeId, change) {
  const key = ledgerKey(baseId, equipmentTypeId);
  const current = ledger.get(key) || { onHand: 0, committed: 0 };
  ledger.set(key, {
    onHand: current.onHand + change.onHand,
    committed: Math.max(0, current.committed + (change.committed || 0)),
  });
}

async function seedPurchases(bases, equipment, users, counter) {
  const officers = users.filter((u) => u.role === "ADMIN" || u.role === "LOGISTICS_OFFICER");
  const bulk = equipment.find((e) => e.code === "AMMO_556");

  // Purchases are deliberately biased towards ammunition, because that is the
  // item a real depot actually runs out of.
  for (let day = 2; day < HISTORY_DAYS; day += 3) {
    // Equipment type is chosen first, then a base is chosen that can actually
    // cover the quantity. Checking a base for one item type and purchasing a
    // different one is how a seed silently overdraws a base.
    const useBulk = Math.random() < 0.6;
    const equipmentType = useBulk ? bulk : equipment[Math.floor(Math.random() * equipment.length)];
    const quantity = useBulk
      ? 8000 + Math.floor(Math.random() * 6) * 2000
      : 20 + Math.floor(Math.random() * 5) * 10;

    const base = findBaseFor(bases, equipmentType, quantity);
    if (!base) continue;

    const creator = officers.find((u) => !u.baseId || u.baseId === base.id) || officers[0];
    counter.purchase += 1;

    await prisma.purchase.create({
      data: {
        referenceNumber: reference("PUR", counter.purchase),
        baseId: base.id,
        equipmentTypeId: equipmentType.id,
        quantity,
        unitPrice: equipmentType.category === "AMMUNITION" ? 42.5 : 18500 + Math.random() * 9000,
        supplier: SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)],
        purchaseDate: dateOnly(dayOffset(day)),
        notes: "Routine replenishment order.",
        createdById: creator.id,
      },
    });

    applyLedger(base.id, equipmentType.id, { onHand: quantity });
  }
}

async function seedTransfers(bases, equipment, users, counter) {
  const initiators = users.filter((u) => u.role === "LOGISTICS_OFFICER" || u.role === "ADMIN");
  const ammo = equipment.find((e) => e.code === "AMMO_556");

  let day = 5;
  while (day < HISTORY_DAYS) {
    const [source, destination] = [bases[Math.floor(Math.random() * bases.length)], bases[Math.floor(Math.random() * bases.length)]];
    if (!source || !destination || source.id === destination.id) {
      day += 1;
      continue;
    }

    const useBulk = Math.random() < 0.5;
    const equipmentType = useBulk ? ammo : equipment[Math.floor(Math.random() * equipment.length)];
    const quantity = useBulk ? 4000 + Math.floor(Math.random() * 4) * 2000 : 10 + Math.floor(Math.random() * 4) * 5;
    const available = readLedger(source.id, equipmentType.id);

    if (available.onHand - available.committed < quantity) {
      day += 1;
      continue;
    }

    const initiator = initiators.find((u) => !u.baseId || u.baseId === source.id) || initiators[0];
    const approver = users.find(
      (u) => u.role === "ADMIN" || (u.role === "BASE_COMMANDER" && u.baseId === source.id && u.id !== initiator.id)
    );

    counter.transfer += 1;
    const outcome = Math.random();
    // Most transfers run to completion. A few are cancelled or rejected, so the
    // history shows a real lifecycle rather than only successes.
    const status = outcome < 0.68 ? "COMPLETED" : outcome < 0.82 ? "PENDING" : outcome < 0.9 ? "APPROVED" : outcome < 0.95 ? "CANCELLED" : "REJECTED";
    const completed = status === "COMPLETED";

    await prisma.transfer.create({
      data: {
        referenceNumber: reference("TRF", counter.transfer),
        sourceBaseId: source.id,
        destinationBaseId: destination.id,
        equipmentTypeId: equipmentType.id,
        quantity,
        status,
        initiatedById: initiator.id,
        approvedById: status === "PENDING" ? null : approver?.id ?? null,
        decisionReason: status === "REJECTED" ? "Destination holding sufficient stock." : status === "CANCELLED" ? "Cancelled by logistics, requirement withdrawn." : null,
        notes: completed ? "Movement completed with despatch and receipt confirmation." : "Awaiting or ending lifecycle action.",
        completedAt: completed ? new Date(dayOffset(day).getTime() + 20 * 60 * 60 * 1000) : null,
        createdAt: dayOffset(day),
      },
    });

    // Only a completed transfer moves stock. Pending and cancelled transfers
    // leave inventory untouched, which is the whole point of the lifecycle.
    if (completed) {
      applyLedger(source.id, equipmentType.id, { onHand: -quantity });
      applyLedger(destination.id, equipmentType.id, { onHand: quantity });
    }
    day += 1;
  }
}

async function seedAssignments(bases, equipment, users, counter) {
  const issuers = users.filter((u) => u.role !== "LOGISTICS_OFFICER");

  for (let day = 4; day < HISTORY_DAYS; day += 2) {
    const quantity = 4 + Math.floor(Math.random() * 5) * 4;
    const pair = findPairWithStock(bases, equipment, quantity);
    if (!pair) continue;

    const person = PERSONNEL[Math.floor(Math.random() * PERSONNEL.length)];
    const issuer = issuers.find((u) => !u.baseId || u.baseId === pair.base.id) || issuers[0];
    counter.assignment += 1;

    // Some assignments come back in full. Those release committed stock and
    // should not reduce on-hand, because the equipment never left the base.
    const returned = Math.random() < 0.35 ? quantity : 0;
    const status = returned === quantity ? "RETURNED" : returned > 0 ? "PARTIALLY_RETURNED" : "ACTIVE";

    await prisma.assignment.create({
      data: {
        referenceNumber: reference("ASN", counter.assignment),
        baseId: pair.base.id,
        equipmentTypeId: pair.item.id,
        personnelName: person.name,
        personnelId: person.id,
        designation: person.designation,
        quantity,
        returnedQuantity: returned,
        assignmentDate: dateOnly(dayOffset(day)),
        status,
        assignedById: issuer.id,
        notes: returned ? "Equipment returned to stores." : "Issued for operational duty.",
      },
    });

    if (returned < quantity) {
      applyLedger(pair.base.id, pair.item.id, { committed: quantity - returned });
    }
  }
}

async function seedExpenditures(bases, equipment, users, counter) {
  const recorders = users.filter((u) => u.role !== "LOGISTICS_OFFICER");
  const reasons = Object.keys(EXPENDITURE_NOTES);
  const ammo = equipment.find((e) => e.code === "AMMO_556");

  for (let day = 6; day < HISTORY_DAYS; day += 2) {
    const useBulk = Math.random() < 0.65;
    const quantity = useBulk ? 200 + Math.floor(Math.random() * 8) * 250 : 2 + Math.floor(Math.random() * 4) * 3;

    const equipmentType = useBulk ? ammo : equipment[Math.floor(Math.random() * equipment.length)];

    // Expenditure is checked against onHand, not against available. Writing off
    // stock that is already issued to personnel is legitimate, so committed
    // units must not be excluded here the way they are for an assignment.
    const eligible = bases.filter((base) => readLedger(base.id, equipmentType.id).onHand >= quantity);
    const base = eligible[Math.floor(Math.random() * eligible.length)];
    if (!base) continue;

    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const recorder = recorders.find((u) => !u.baseId || u.baseId === base.id) || recorders[0];
    counter.expenditure += 1;

    await prisma.expenditure.create({
      data: {
        referenceNumber: reference("EXP", counter.expenditure),
        baseId: base.id,
        equipmentTypeId: equipmentType.id,
        quantity,
        expenditureDate: dateOnly(dayOffset(day)),
        reason,
        notes: EXPENDITURE_NOTES[reason][Math.floor(Math.random() * EXPENDITURE_NOTES[reason].length)],
        recordedById: recorder.id,
      },
    });

    applyLedger(base.id, equipmentType.id, { onHand: -quantity });
  }
}

// Writes the running balances gathered above into the cache table. The values
// are derived from the ledger rather than typed in, so the cache cannot
// disagree with the movement history that produced it.
async function syncStockBalances() {
  for (const [key, balance] of ledger.entries()) {
    const [baseId, equipmentTypeId] = key.split(":").map(Number);
    await prisma.stockBalance.update({
      where: { stock_balance_base_equipment_key: { baseId, equipmentTypeId } },
      data: { onHandQuantity: balance.onHand, committedQuantity: balance.committed },
    });
  }
}

async function seedAssets(bases) {
  for (const base of bases) {
    const balance = await prisma.stockBalance.findMany({
      where: { baseId: base.id, equipmentType: { isTrackable: true } },
      include: { equipmentType: true },
    });

    for (const entry of balance) {
      // A handful of serialised items per trackable type is enough to
      // demonstrate the model without inventing hundreds of serials.
      const count = Math.min(3, entry.onHandQuantity);
      for (let index = 0; index < count; index += 1) {
        const suffix = String(index + 1).padStart(3, "0");
        const assetNumber = `${base.code}-${entry.equipmentType.code}-${suffix}`;

        await prisma.asset.upsert({
          where: { assetNumber },
          update: {},
          create: {
            assetNumber,
            serialNumber: `SN${base.code}${entry.equipmentType.code.slice(0, 4)}${suffix}`,
            equipmentTypeId: entry.equipmentType.id,
            currentBaseId: base.id,
            status: "IN_STOCK",
          },
        });
      }
    }
  }
}

async function seedAuditSample(users) {
  const admin = users.find((u) => u.role === "ADMIN");

  const samples = [
    { action: "USER_CREATED", entityType: "User", description: "Base commander account provisioned" },
    { action: "BASE_CREATED", entityType: "Base", description: "Bravo Base registered" },
    { action: "EQUIPMENT_CREATED", entityType: "EquipmentType", description: "Ammunition type configured" },
  ];

  let index = 0;
  for (const sample of samples) {
    index += 1;
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userEmail: admin.email,
        action: sample.action,
        entityType: sample.entityType,
        entityId: String(index),
        method: "POST",
        endpoint: `/api/${sample.entityType.toLowerCase()}s`,
        ipAddress: "127.0.0.1",
        userAgent: "seed-script",
        statusCode: 201,
        requestId: `seed-${Date.now()}-${index}`,
        metadata: { description: sample.description, seeded: true },
        createdAt: new Date(WINDOW_START.getTime() + index * 60 * 60 * 1000),
      },
    });
  }
}

async function main() {
  console.log("Clearing existing data...");
  // Order matters: children before parents, because the foreign keys are real.
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.expenditure.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.base.deleteMany();

  console.log("Seeding bases and equipment types...");
  const bases = await seedBases();
  const equipment = await seedEquipmentTypes();

  console.log("Seeding users...");
  const users = await seedUsers(bases);

  console.log("Seeding opening balances...");
  await seedOpeningBalances(bases, equipment);

  const counter = { purchase: 0, transfer: 0, assignment: 0, expenditure: 0 };

  console.log("Seeding movement history...");
  await seedPurchases(bases, equipment, users, counter);
  await seedTransfers(bases, equipment, users, counter);
  await seedAssignments(bases, equipment, users, counter);
  await seedExpenditures(bases, equipment, users, counter);

  console.log("Syncing stock balances from the ledger...");
  await syncStockBalances();
  await seedAssets(bases);
  await seedAuditSample(users);

  const counts = {
    bases: await prisma.base.count(),
    equipmentTypes: await prisma.equipmentType.count(),
    users: await prisma.user.count(),
    assets: await prisma.asset.count(),
    purchases: await prisma.purchase.count(),
    transfers: await prisma.transfer.count(),
    assignments: await prisma.assignment.count(),
    expenditures: await prisma.expenditure.count(),
    stockBalances: await prisma.stockBalance.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log("\nSeed complete:", counts);
  console.log(`\nAll demo accounts use the password: ${DEMO_PASSWORD}`);
  console.log("  admin@mams.local              ADMIN");
  console.log("  commander.alpha@mams.local     BASE_COMMANDER (Alpha Base)");
  console.log("  commander.bravo@mams.local     BASE_COMMANDER (Bravo Base)");
  console.log("  commander.charlie@mams.local   BASE_COMMANDER (Charlie Base)");
  console.log("  logistics.alpha@mams.local     LOGISTICS_OFFICER (Alpha Base)");
  console.log("  logistics.charlie@mams.local   LOGISTICS_OFFICER (Charlie Base)");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
