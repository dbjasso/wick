import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { createTagSchema } from "@/lib/schemas";

// GET /api/tags — listado con conteo de registros.
export async function GET() {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const tags = await prisma.tag.findMany({
    where: { accountId },
    orderBy: { name: "asc" },
    include: { _count: { select: { records: true } } },
  });
  return NextResponse.json({ items: tags });
}

// POST /api/tags — crear tag con nombre y color.
export async function POST(request: Request) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, color, description } = parsed.data;
  const existing = await prisma.tag.findUnique({
    where: { accountId_name: { accountId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un tag con ese nombre." }, { status: 409 });
  }
  const tag = await prisma.tag.create({
    data: { name, color, description, accountId },
    include: { _count: { select: { records: true } } },
  });
  return NextResponse.json(tag, { status: 201 });
}
