import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
  prismaFingerprint?: string;
};

const url = process.env.DATABASE_URL;
// Bump when schema changes so dev hot-reload doesn't keep a stale PrismaClient.
const SCHEMA_FINGERPRINT = "todo-dueDate-v2-explicit-url";

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({
    datasources: { db: { url } },
    log: ["error", "warn"],
  });
}

const cacheOk =
  globalForPrisma.prisma &&
  globalForPrisma.prismaUrl === url &&
  globalForPrisma.prismaFingerprint === SCHEMA_FINGERPRINT;

export const prisma = cacheOk ? globalForPrisma.prisma! : createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUrl = url;
  globalForPrisma.prismaFingerprint = SCHEMA_FINGERPRINT;
}
