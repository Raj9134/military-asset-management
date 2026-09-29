import { Router } from "express";

import * as expenditureController from "../controllers/expenditureController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createExpenditureSchema,
  listExpendituresSchema,
  reverseExpenditureSchema,
} from "../validators/expenditure.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listExpendituresSchema), expenditureController.list);
router.get("/:id", validateParams(idParamSchema), expenditureController.getById);

// Writing equipment off is a base-level judgement call, so all roles may record
// it within their own base. Logistics officers are excluded because their remit
// is movement, not disposal.
router.post("/", authorize(ROLES.ADMIN, ROLES.BASE_COMMANDER), validateBody(createExpenditureSchema), expenditureController.create);

// Reversing one puts stock back, so it is admin only.
router.post("/:id/reverse", authorize(ROLES.ADMIN), validateParams(idParamSchema), validateBody(reverseExpenditureSchema), expenditureController.reverse);

export default router;
