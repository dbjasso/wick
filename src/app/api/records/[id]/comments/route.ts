import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { createCommentSchema } from "@/lib/schemas";
import { recordForAccount } from "@/lib/account-scope";

// POST /api/records/:id/comments — agregar un comentario al registro.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id: recordId } = await params;

  const record = await recordForAccount(recordId, accountId);
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, recordId },
  });
  return NextResponse.json(comment, { status: 201 });
}
