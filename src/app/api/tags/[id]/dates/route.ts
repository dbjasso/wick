import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { createImportantDateSchema } from "@/lib/schemas";
import { tagForAccount } from "@/lib/account-scope";

// POST /api/tags/:id/dates — agregar fecha importante a un tag.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createImportantDateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const exists = await tagForAccount(id, accountId);
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const date = await prisma.importantDate.create({
    data: { label: parsed.data.label, date: new Date(parsed.data.date), tagId: id },
  });
  return NextResponse.json(date, { status: 201 });
}
