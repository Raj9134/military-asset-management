import { Router } from "express";

import * as purchaseController from "../controllers/purchaseController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { createPurchaseSchema, listPurchasesSchema, reversePurchaseSchema } from "../validators/purchase.validator.js";
import { idParamSchema } from "../validators/common.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticate);

// A base commander sees purchases, but only their base's. The scope lives in the
// service query, so that restriction holds no matter which route is used.
router.get("/", validateQuery(listPurchasesSchema), purchaseController.list);
router.get("/:id", validateParams(idParamSchema), purchaseController.getById);

// Purchasing is a logistics function. A base commander receives equipment
// through transfers and allocations rather than buying it directly.
router.post("/", authorize(ROLES.ADMIN, ROLES.LOGISTICS_OFFICER), validateBody(createPurchaseSchema), purchaseController.create);

// Reversing a purchase rewrites a recorded receipt, so it is admin only.
router.post("/:id/reverse", authorize(ROLES.ADMIN), validateParams(idParamSchema), validateBody(reversePurchaseSchema), purchaseController.reverse);

export default router;
