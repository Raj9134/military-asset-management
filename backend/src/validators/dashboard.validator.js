import { z } from "zod";
import { withDateRange } from "./common.js";

export const dashboardQuerySchema = withDateRange(
  z.object({
    baseId: z.coerce.number().int().positive().optional(),
    equipmentTypeId: z.coerce.number().int().positive().optional(),
  })
);
