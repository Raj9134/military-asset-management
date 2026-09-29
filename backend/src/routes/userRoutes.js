import { Router } from "express";

import * as userController from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { listUsersSchema, createUserSchema, updateUserSchema } from "../validators/user.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

/**
 * Every route here is administrative. User management is the capability that
 * decides who can reach everything else, so it is restricted at the router
 * rather than relying on the frontend omitting the nav item.
 */
router.use(authorize(ROLES.ADMIN));

router.get("/", validateQuery(listUsersSchema), userController.list);
router.get("/:id", validateParams(idParamSchema), userController.getById);
router.post("/", validateBody(createUserSchema), userController.create);
router.patch("/:id", validateParams(idParamSchema), validateBody(updateUserSchema), userController.update);

export default router;
