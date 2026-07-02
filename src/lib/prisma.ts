import { PrismaClient } from "@prisma/client";

// ponytail: singleton global para evitar instancias múltiples en dev
// (Next recarga módulos en hot-reload y crea PrismaClients de más).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
