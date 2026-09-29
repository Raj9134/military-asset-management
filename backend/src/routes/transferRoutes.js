import { Router } from "express";

import * as transferController from "../controllers/transferController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createTransferSchema,
  listTransfersSchema,
  decisionSchema,
  completeTransferSchema,
} from "../validators/transfer.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listTransfersSchema), transferController.list);
router.get("/:id", validateParams(idParamSchema), transferController.getById);

// Anyone who can act on a base can raise a transfer out of it. The service
// refuses a logistics officer or commander acting outside their own base.
router.post("/", validateBody(createTransferSchema), transferController.create);

// Approval is the source base's decision. The self-approval ban and the status
// check both live in the service, so they cannot be bypassed by calling a
// different route.
router.post("/:id/approve", authorize(ROLES.ADMIN, ROLES.BASE_COMMANDER, ROLES.LOGISTICS_OFFICER), validateParams(idParamSchema), validateBody(decisionSchema), transferController.approve);
router.post("/:id/reject", authorize(ROLES.ADMIN, ROLES.BASE_COMMANDER, ROLES.LOGISTICS_OFFICER), validateParams(idParamSchema), validateBody(decisionSchema), transferController.reject);

// Completion is the destination base's responsibility, since it is the base
// that has to receive and verify the equipment.
router.post("/:id/complete", authorize(ROLES.ADMIN, ROLES.LOGISTICS_OFFICER, ROLES.BASE_COMMANDER), validateParams(idParamSchema), validateBody(completeTransferSchema), transferController.complete);

router.post("/:id/cancel", validateParams(idParamSchema), transferController.cancel);

export default router;
