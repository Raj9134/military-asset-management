export const ROLES = {
  ADMIN: "ADMIN",
  BASE_COMMANDER: "BASE_COMMANDER",
  LOGISTICS_OFFICER: "LOGISTICS_OFFICER",
};

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

export const TRANSFER_STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const ASSIGNMENT_STATUS_LABELS = {
  ACTIVE: "Active",
  PARTIALLY_RETURNED: "Partially returned",
  RETURNED: "Returned",
  EXPIRED: "Expired",
};

export const EXPENDITURE_REASONS = [
  { value: "TRAINING", label: "Training consumption" },
  { value: "DAMAGE", label: "Damaged equipment" },
  { value: "LOSS", label: "Lost equipment" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Other" },
];

export const EQUIPMENT_CATEGORIES = [
  { value: "VEHICLE", label: "Vehicle" },
  { value: "WEAPON", label: "Weapon" },
  { value: "AMMUNITION", label: "Ammunition" },
  { value: "OTHER", label: "Other" },
];
