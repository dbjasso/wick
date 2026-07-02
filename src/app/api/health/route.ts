import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Health check: confirma que la app responde y que Postgres está alcanzable.
export async function GET() {
  try {
    // $queryRaw devuelve un array; descartamos el resultado.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (err) {
    console.error("[health] db error", err);
    return NextResponse.json(
      { ok: true, db: false, error: "database unavailable" },
      { status: 503 },
    );
  }
}
