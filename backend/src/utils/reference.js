import { randomUUID } from "node:crypto";

export function generateReference(prefix, id) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(id).padStart(4, "0")}`;
}

export const REFERENCE_PREFIX = {
  PURCHASE: "PUR",
  TRANSFER: "TRF",
  ASSIGNMENT: "ASN",
  EXPENDITURE: "EXP",
};

/**
 * Creates a ledger row and stamps its human readable reference from the id it
 * was assigned.
 *
 * Deriving the reference from the primary key keeps it unique without a counter,
 * and a counter would need a lock or a retry on conflict to stay correct when
 * two requests land at once. The placeholder exists only because the column is
 * NOT NULL, so the row can be inserted before its final reference is known.
 * Both steps run inside the caller's transaction, so the intermediate value is
 * never visible to another connection.
 *
 * The placeholder is trimmed to fit referenceNumber, which is a varchar(30).
 * A full UUID would overflow the column and fail the insert.
 */
export async function createWithReference(tx, model, data, prefix) {
  const placeholder = `TMP-${randomUUID().replace(/-/g, "").slice(0, 24)}`;

  const created = await tx[model].create({
    data: { ...data, referenceNumber: placeholder },
  });

  return tx[model].update({
    where: { id: created.id },
    data: { referenceNumber: generateReference(prefix, created.id) },
  });
}
