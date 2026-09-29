import { Router } from "express";

import * as baseController from "../controllers/baseController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { createBaseSchema, updateBaseSchema, listBasesSchema } from "../validators/base.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

// Any authenticated user needs the list of bases to fill a filter dropdown or
// name a destination on a transfer. What a non-admin cannot do is read another
// base's movements, and that is enforced inside the movement services.
router.get("/", validateQuery(listBasesSchema), baseController.list);
router.get("/:id", validateParams(idParamSchema), baseController.getById);

// Master data is administrative. A base or equipment type cannot be invented by
// anyone who merely holds a valid token.
router.post("/", authorize(ROLES.ADMIN), validateBody(createBaseSchema), baseController.create);
router.patch("/:id", authorize(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateBaseSchema), baseController.update);
router.get("/:id/usage", authorize(ROLES.ADMIN), validateParams(idParamSchema), baseController.usage);

export default router;
