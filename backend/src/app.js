import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

const app = express();

// Behind Render or another proxy this makes req.ip the real client address,
// which the audit log later stores.
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header come from curl, Postman or a health
      // check. Browsers always send one, so there is no CORS risk in allowing it.
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.isProduction ? "combined" : "dev"));

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

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
