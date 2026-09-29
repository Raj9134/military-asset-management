import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema } from "../validators/auth.validator.js";

const router = Router();

/**
 * Rate limiting on the credential endpoints only.
 *
 * bcrypt at cost 12 makes each login attempt expensive to the server, so an
 * unthrottled endpoint is a denial of service vector as well as a credential
 * stuffing one. Ten attempts per fifteen minutes per IP is generous for a human
 * and slow enough to make an online guessing attack impractical.
 *
 * The limiter is skipped in tests so the suite is not rate limited by its own
 * repeated logins.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in 15 minutes.",
    error: "RATE_LIMITED",
  },
});

// Public endpoints come first. They must be declared above the authentication
// guard, because router.use applies to every route registered after it.
router.post("/register", authLimiter, validateBody(registerSchema), authController.register);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", validateBody(refreshSchema), authController.refresh);

// Everything below requires a valid access token. Declaring the guard here
// means a route added to this file later is protected unless it is explicitly
// moved above this line.
router.use(authenticate);

router.post("/logout", authController.logout);
router.get("/me", authController.me);
router.post("/change-password", validateBody(changePasswordSchema), authController.changePassword);

export default router;
