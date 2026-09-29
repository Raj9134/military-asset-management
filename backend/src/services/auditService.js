import prisma from "../config/prisma.js";

/**
 * Any key that looks like a credential is stripped before the object is written
 * to the audit table.
 *
 * Redaction happens here rather than at each call site, because a call site is
 * exactly where somebody forgets. Doing it in one function means a future
 * developer who logs a whole request body by accident still cannot leak a
 * password into the database.
 */
const SENSITIVE_KEY = /password|token|secret|hash|authorization|credential/i;

function redact(value) {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(redact);
  }

  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = "[redacted]";
    } else if (entry instanceof Date) {
      output[key] = entry.toISOString();
    } else {
      output[key] = redact(entry);
    }
  }
  return output;
}

/**
 * Writes an audit entry.
 *
 * Pass `tx` when the audit row must share a transaction with the change it
 * describes. That is the default for anything that moves inventory: if the
 * business operation rolls back, so does its audit trail, and the log can
 * never claim something happened that did not.
 */
export async function record({ req, tx = prisma, action, entityType, entityId = null, metadata = null }) {
  return tx.auditLog.create({
    data: {
      userId: req?.user?.id ?? null,
      userEmail: req?.user?.email ?? null,
      action,
      entityType,
      entityId: entityId === null ? null : String(entityId),
      method: req?.method ?? "SYSTEM",
      endpoint: req?.originalUrl ? req.originalUrl.slice(0, 200) : "SYSTEM",
      ipAddress: req?.ipAddress ?? null,
      userAgent: req?.userAgent ?? null,
      requestId: req?.requestId ?? "system",
      metadata: metadata ? redact(metadata) : undefined,
    },
  });
}

/**
 * Audit of a failed login. Recorded without a user row because at this point
 * the account may not exist, and repeated failures are exactly what an
 * administrator wants to see.
 */
export async function recordFailedLogin({ req, email, reason }) {
  return prisma.auditLog.create({
    data: {
      userId: null,
      userEmail: email ? String(email).slice(0, 180) : null,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: null,
      method: req?.method ?? "POST",
      endpoint: req?.originalUrl ?? "/api/auth/login",
      ipAddress: req?.ipAddress ?? null,
      userAgent: req?.userAgent ?? null,
      requestId: req?.requestId ?? "system",
      metadata: { reason },
    },
  });
}

export { redact };
