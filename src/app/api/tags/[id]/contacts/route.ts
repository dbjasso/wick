import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { createContactSchema } from "@/lib/schemas";
import { tagForAccount } from "@/lib/account-scope";

// POST /api/tags/:id/contacts — agregar contacto a un tag.
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
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const exists = await tagForAccount(id, accountId);
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const contact = await prisma.contact.create({
    data: { ...parsed.data, tagId: id },
  });
  return NextResponse.json(contact, { status: 201 });
}
