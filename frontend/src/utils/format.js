export const formatNumber = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-GB").format(value)
    : "—";

// A dash rather than a zero for a figure that is deliberately absent, so that
// "not calculated for this filter" never reads as "zero".
export const formatQuantity = (value, unit = "") => {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
};

export const formatCurrency = (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "USD" }).format(value)
    : "—";

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** ISO date string for an <input type="date"> value. */
export const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const formatStatus = (status) =>
  status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ") : "—";

export function fieldErrors(error) {
  if (!error?.details) return {};
  return error.details.reduce((acc, item) => {
    acc[item.field] = item.message;
    return acc;
  }, {});
}
