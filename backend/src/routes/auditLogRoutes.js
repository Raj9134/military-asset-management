import { Router } from "express";

import * as auditLogController from "../controllers/auditLogController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateParams, validateQuery } from "../middleware/validate.js";
import { listAuditLogsSchema } from "../validators/auditLog.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate);

// Readable by every role, but the service restricts what each one sees:
// administrators see everything, a base commander sees entries for their own
// base's records, and a logistics officer sees their own actions.
router.get("/", validateQuery(listAuditLogsSchema), auditLogController.list);
router.get("/filters", auditLogController.filterOptions);
router.get("/:id", validateParams(idParamSchema), auditLogController.getById);

export default router;
