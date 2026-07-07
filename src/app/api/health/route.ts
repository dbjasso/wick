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
  let schema = false;
  let schemaError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Record'
      ) AS "exists"
    `;
    schema = rows[0]?.exists ?? false;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown";
    console.error("[health] db error", err);
  }

  if (db && !schema) {
    schemaError =
      'Tabla "Record" no existe — corre `npx prisma migrate deploy` contra prod (usa DIRECT_URL sin pooler).';
  }

  const ok = missing.length === 0 && db && schema;
  return NextResponse.json(
    {
      ok,
      env,
      missing,
      missingForMigrations,
      db,
      schema,
      dbError: db ? undefined : dbError,
      schemaError: schema ? undefined : schemaError,
    },
    { status: ok ? 200 : 503 },
  );
}
