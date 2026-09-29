import { Router } from "express";

import * as assignmentController from "../controllers/assignmentController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createAssignmentSchema,
  returnAssignmentSchema,
  listAssignmentsSchema,
} from "../validators/assignment.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listAssignmentsSchema), assignmentController.list);
router.get("/:id", validateParams(idParamSchema), assignmentController.getById);

// Issuing equipment is a base-level operation, so every role may do it. The
// service restricts it to the caller's own base, and to stock that is genuinely
// available.
router.post("/", validateBody(createAssignmentSchema), assignmentController.create);
router.post("/:id/return", validateParams(idParamSchema), validateBody(returnAssignmentSchema), assignmentController.returnEquipment);

export default router;
