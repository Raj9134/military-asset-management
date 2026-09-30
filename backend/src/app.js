import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { attachRequestContext } from "./middleware/auditContext.js";
import { sendSuccess } from "./utils/response.js";
import authRoutes from "./routes/authRoutes.js";
import baseRoutes from "./routes/baseRoutes.js";
import equipmentTypeRoutes from "./routes/equipmentTypeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import expenditureRoutes from "./routes/expenditureRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";

const app = express();

// Behind Render or another proxy this makes req.ip the real client address,
// which the audit log later stores.
app.set("trust proxy", 1);

app.use(helmet());

// A rejected origin must produce a CORS refusal, not a thrown error.
//
// The previous version called back with `new Error(...)`. The cors package
// passes that straight to Express as a failed middleware callback, so the
// request fell through to the generic error handler and answered 500
// INTERNAL_ERROR. Two things were wrong with that:
//
//   1. the status code. A cross-origin refusal is 403, and 500 tells the
//      caller the server is broken when the server is working correctly.
//   2. the body. The generic handler returned "An unexpected error occurred",
//      so the browser got no explanation and no CORS headers to act on.
//
// Callback with `false` instead: cors omits the Access-Control-Allow-Origin
// header, which is exactly what makes a browser refuse the response, and the
// request continues to its route. Nothing sensitive is exposed, because the
// browser will not let the calling page read a response that lacks the header.
const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header come from curl, Postman or a health
    // check. Browsers always send one, so there is no CORS risk in allowing it.
    if (!origin || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Answer the browser's preflight itself, and do it before anything else can
// reject the request. Without this, a cross-origin POST or DELETE is sent as an
// OPTIONS probe that Express would 404, and the browser reports a CORS failure
// even when the origin is perfectly acceptable.
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.isProduction ? "combined" : "dev"));

// Runs before every route so that a request id and the caller's address are
// already available to any service that writes an audit entry.
app.use(attachRequestContext);

// Checking the database here means a broken DATABASE_URL shows up on the
// health endpoint instead of as a confusing failure on the first real request.
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, 200, "Service is healthy", {
      status: "ok",
      database: "connected",
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Service is unavailable",
      error: "DATABASE_UNAVAILABLE",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/bases", baseRoutes);
app.use("/api/equipment-types", equipmentTypeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/expenditures", expenditureRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
