import { randomUUID } from "node:crypto";

// Gives every request a correlation id and captures the details the audit log
// needs, so that individual service calls do not each have to reach into req.
export function attachRequestContext(req, res, next) {
  // Honouring an inbound id lets a frontend trace continue across services.
  req.requestId = req.get("x-request-id") || randomUUID();
  req.ipAddress = req.ip;
  req.userAgent = req.get("user-agent") || null;
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
