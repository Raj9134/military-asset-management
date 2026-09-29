import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
];

const missing = required.filter((key) => !process.env[key]);

// Fail loudly at boot. A server that starts without a JWT secret would only
// discover the problem when the first login is attempted.
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy backend/.env.example to backend/.env and fill in the values.");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const weakSecret = process.env.JWT_SECRET.length < 32;
  if (weakSecret || process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error("Refusing to start: JWT secrets must be long and different from each other.");
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
