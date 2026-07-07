import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
  prismaFingerprint?: string;
};

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

function getPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  const cacheOk =
    globalForPrisma.prisma &&
    globalForPrisma.prismaUrl === url &&
    globalForPrisma.prismaFingerprint === SCHEMA_FINGERPRINT;

  if (cacheOk) return globalForPrisma.prisma!;

  const client = createPrisma();
  // Cache en prod también: serverless reusa la instancia; sin esto el Proxy
  // creaba un PrismaClient nuevo en cada prisma.* del mismo request.
  globalForPrisma.prisma = client;
  globalForPrisma.prismaUrl = url;
  globalForPrisma.prismaFingerprint = SCHEMA_FINGERPRINT;
  return client;
}

// ponytail: lazy Proxy so `next build` can load route modules without DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
