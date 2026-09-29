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
