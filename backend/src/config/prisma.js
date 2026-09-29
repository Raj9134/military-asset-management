import { PrismaClient } from "@prisma/client";

// PrismaClient holds a connection pool, so creating more than one per process
// wastes connections. In development nodemon restarts the process often, so the
// instance is cached on globalThis to survive those restarts.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
