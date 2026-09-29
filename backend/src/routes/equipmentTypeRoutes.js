import { Router } from "express";

import * as equipmentTypeController from "../controllers/equipmentTypeController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import {
  createEquipmentTypeSchema,
  updateEquipmentTypeSchema,
  listEquipmentTypesSchema,
} from "../validators/equipmentType.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

// Readable by everyone: equipment types are reference data that every filter
// dropdown and movement form needs.
router.get("/", validateQuery(listEquipmentTypesSchema), equipmentTypeController.list);
router.get("/all", equipmentTypeController.listAll);
router.get("/:id", validateParams(idParamSchema), equipmentTypeController.getById);

// Scoped to the base being asked about, and refused for another base unless the
// caller is an admin. This is the first endpoint where base scope is enforced.
router.get("/base/:id", validateParams(idParamSchema), equipmentTypeController.listForBase);

// Administrative. Adding a new equipment type changes what the whole system
// accepts, so it is not something any valid token should permit.
router.post("/", authorize(ROLES.ADMIN), validateBody(createEquipmentTypeSchema), equipmentTypeController.create);
router.patch("/:id", authorize(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateEquipmentTypeSchema), equipmentTypeController.update);
router.get("/:id/usage", authorize(ROLES.ADMIN), validateParams(idParamSchema), equipmentTypeController.usage);

export default router;
