// Builds a realistic set of activity on top of the seed, so the submitted
// database dump and the Audit Logs screen both contain meaningful history
// rather than three synthetic entries.
//
// Uses the public API with real role tokens, so everything it writes is
// indistinguishable from genuine use: same routes, same validation, same audit
// trail. Run after `npm run seed`.

const API = "http://localhost:5000/api";
const PASSWORD = "Passw0rd@2026";

async function call(path, { method = "GET", body, token, label } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${label ? `[${label}] ` : ""}${method} ${path} -> ${response.status} ${payload.message || ""}` +
        (body ? ` | body=${JSON.stringify(body)}` : "")
    );
  }
  return payload.data;
}

async function login(email) {
  const data = await call("/auth/login", { method: "POST", body: { email, password: PASSWORD } });
  return data.accessToken;
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

async function main() {
  console.log("Building demo activity through the API...\n");

  const admin = await login("admin@mams.local");
  const alphaCommander = await login("commander.alpha@mams.local");
  const alphaLogistics = await login("logistics.alpha@mams.local");
  const charlieLogistics = await login("logistics.charlie@mams.local");
  const bravoCommander = await login("commander.bravo@mams.local");

  const { bases, equipmentTypes } = await call("/dashboard/filters", { token: admin });
  const base = (code) => bases.find((b) => b.code === code).id;
  const equip = (code) => equipmentTypes.find((e) => e.code === code).id;

  const alpha = base("ALPHA");
  const bravo = base("BRAVO");
  const charlie = base("CHARLIE");
  const rifle = equip("ASSAULT_RIFLE");
  const ammo = equip("AMMO_556");

  // 1. A resupply of ammunition into each base. Each purchase is made by a
  //    logistics officer scoped to that base, because the API refuses a scoped
  //    officer buying into anywhere else.
  const resupply = [
    { target: alpha, token: alphaLogistics, qty: 24000 },
    { target: charlie, token: charlieLogistics, qty: 40000 },
    { target: bravo, token: admin, qty: 16000 },
  ];

  for (const { target, token, qty } of resupply) {
    await call("/purchases", {
      method: "POST",
      token,
      label: `resupply base ${target}`,
      body: {
        baseId: target,
        equipmentTypeId: ammo,
        quantity: qty,
        purchaseDate: daysAgo(21),
        supplier: "Northwind Defence Supplies",
      },
    });
  }

  await call("/purchases", {
    method: "POST",
    token: alphaLogistics,
    label: "alpha rifles",
    body: {
      baseId: alpha,
      equipmentTypeId: rifle,
      quantity: 120,
      purchaseDate: daysAgo(14),
      supplier: "Meridian Ordnance Corporation",
      unitPrice: 2150,
    },
  });

  // 2. A transfer that runs the full lifecycle.
  const transfer = await call("/transfers", {
    method: "POST",
    token: alphaLogistics,
    body: {
      sourceBaseId: alpha,
      destinationBaseId: bravo,
      equipmentTypeId: rifle,
      quantity: 40,
      notes: "Reinforcement of the forward element ahead of the exercise programme.",
    },
  });

  await call(`/transfers/${transfer.id}/approve`, {
    method: "POST",
    token: alphaCommander,
    body: { reason: "Approved against the quarterly distribution plan." },
  });

  await call(`/transfers/${transfer.id}/complete`, {
    method: "POST",
    token: bravoCommander,
    body: { notes: "Received and counted into stores." },
  });

  // 3. A second transfer, left pending, so the lifecycle screen is not all-completed.
  //    Raised by Charlie's own officer, since a transfer must originate at the
  //    base the caller belongs to.
  await call("/transfers", {
    method: "POST",
    token: charlieLogistics,
    body: {
      sourceBaseId: charlie,
      destinationBaseId: alpha,
      equipmentTypeId: ammo,
      quantity: 12000,
      notes: "Awaiting approval from the source base.",
    },
  });

  // 4. Issue equipment to named personnel, then part of it is consumed.
  const issue = await call("/assignments", {
    method: "POST",
    token: alphaCommander,
    body: {
      baseId: alpha,
      equipmentTypeId: rifle,
      quantity: 30,
      personnelName: "Capt. Arjun Rathore",
      personnelId: "SV-4471",
      designation: "Platoon Commander",
      assignmentDate: daysAgo(9),
      notes: "Issued for the live fire serial.",
    },
  });

  await call("/expenditures", {
    method: "POST",
    token: alphaCommander,
    body: {
      baseId: alpha,
      equipmentTypeId: rifle,
      quantity: 8,
      expenditureDate: daysAgo(7),
      reason: "TRAINING",
      assignmentId: issue.id,
      notes: "Consumed during the live fire serial.",
    },
  });

  // 5. Damaged equipment written off from unissued stock.
  await call("/expenditures", {
    method: "POST",
    token: alphaCommander,
    body: {
      baseId: alpha,
      equipmentTypeId: rifle,
      quantity: 5,
      expenditureDate: daysAgo(5),
      reason: "DAMAGE",
      notes: "Barrel heat damage beyond service limit.",
    },
  });

  // 6. A return, showing the lifecycle of an assignment closing out.
  await call(`/assignments/${issue.id}/return`, {
    method: "POST",
    token: alphaCommander,
    body: { returnedQuantity: 12, notes: "Returned to stores after the serial." },
  });

  // 7. A purchase entered in error and reversed, so the reversal path is visible.
  const wrong = await call("/purchases", {
    method: "POST",
    token: admin,
    label: "reversible purchase",
    body: {
      baseId: bravo,
      equipmentTypeId: rifle,
      quantity: 25,
      purchaseDate: daysAgo(4),
      supplier: "Halcyon Logistics",
    },
  });

  await call(`/purchases/${wrong.id}/reverse`, {
    method: "POST",
    token: admin,
    body: { reason: "Duplicate of order HL-2291, raised twice by the depot." },
  });

  const auditCount = await call("/audit-logs?limit=1", { token: admin });

  console.log("Done.");
  console.log(`  audit entries now: ${auditCount.total}`);
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
