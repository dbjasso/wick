import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  missingMigrationEnv,
  missingRuntimeEnv,
  runtimeEnvStatus,
} from "@/lib/env-check";

// Health check: env vars requeridas + conexión a Postgres.
export async function GET() {
  const env = runtimeEnvStatus();
  const missing = missingRuntimeEnv();
  const missingForMigrations = missingMigrationEnv();

  let db = false;
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown";
    console.error("[health] db error", err);
  }

  const ok = missing.length === 0 && db;
  return NextResponse.json(
    {
      ok,
      env,
      missing,
      missingForMigrations,
      db,
      dbError: db ? undefined : dbError,
    },
    { status: ok ? 200 : 503 },
  );
}
