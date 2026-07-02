import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createCommentSchema } from "@/lib/schemas";

// POST /api/records/:id/comments — agregar un comentario al registro.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: recordId } = await params;

  const record = await prisma.record.findUnique({ where: { id: recordId } });
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
