import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { updateRecordSchema } from "@/lib/schemas";
import { syncRecordTags } from "@/lib/records";
import { repairTaskItemNodeIds, syncTodoItems } from "@/lib/todos";
import { sanitizeContent } from "@/lib/sanitize";
import { recordForAccount } from "@/lib/account-scope";

// GET /api/records/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const record = await recordForAccount(id, accountId);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const full = await prisma.record.findUnique({
    where: { id },
    include: {
      tags: true,
      comments: { orderBy: { createdAt: "asc" } },
      todoItems: true,
    },
  });
  return NextResponse.json(full);
}

// PATCH /api/records/:id — update parcial (content, date y/o tags).
// Endpoint de autosave: pensado para llamarse frecuentemente.
export async function PATCH(
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
  const parsed = updateRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, content, tags } = parsed.data;

  const existing = await recordForAccount(id, accountId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { date?: Date; content?: unknown } = {};
  if (date !== undefined) data.date = new Date(date);
  let safeContent: unknown | undefined;
  if (content !== undefined) {
    safeContent = repairTaskItemNodeIds(sanitizeContent(content));
    data.content = safeContent as never;
  }

  if (Object.keys(data).length) {
    await prisma.record.update({ where: { id }, data: data as never });
  }
  if (safeContent !== undefined) {
    await syncTodoItems(id, safeContent);
  }
  if (tags !== undefined) {
    await syncRecordTags(id, tags, accountId);
  }

  const fresh = await prisma.record.findUnique({
    where: { id },
    include: { tags: true, comments: { orderBy: { createdAt: "asc" } }, todoItems: true },
  });
  return NextResponse.json(fresh);
}

// DELETE /api/records/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const existing = await recordForAccount(id, accountId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.record.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
