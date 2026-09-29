import { Router } from "express";

import * as dashboardController from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { dashboardQuerySchema } from "../validators/dashboard.validator.js";

const router = Router();

// Every authenticated role can see a dashboard. What differs is the data:
// the service pins a non-admin to their own base regardless of the filter they
// send, so the numbers are computed in the database under the caller's scope.
router.use(authenticate);

router.get("/summary", validateQuery(dashboardQuerySchema), dashboardController.summary);
router.get("/movements", validateQuery(dashboardQuerySchema), dashboardController.movements);
router.get("/net-movement-details", validateQuery(dashboardQuerySchema), dashboardController.netMovementDetails);

// Populates the date, base and equipment filters in a single request.
router.get("/filters", dashboardController.filterOptions);

export default router;
