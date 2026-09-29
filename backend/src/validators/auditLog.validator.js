import { z } from "zod";
import { paginationSchema, withDateRange } from "./common.js";

export const listAuditLogsSchema = withDateRange(
  paginationSchema.extend({
    action: z.string().trim().max(40).optional(),
    entityType: z.string().trim().max(40).optional(),
    entityId: z.string().trim().max(60).optional(),
    userId: z.coerce.number().int().positive().optional(),
  })
);
