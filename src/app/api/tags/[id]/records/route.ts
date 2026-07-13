import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { encodeRecordCursor, parseRecordCursor } from "@/lib/record-cursor";
import { tagForAccount } from "@/lib/account-scope";

// GET /api/tags/:id/records?cursor=&limit=20 — paginación por cursor (createdAt+id).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id: tagId } = await params;
  const tag = await tagForAccount(tagId, accountId);
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const cursor = parseRecordCursor(url.searchParams.get("cursor"));

  const items = await prisma.record.findMany({
    where: {
      accountId,
      tags: { some: { id: tagId } },
      ...(cursor && {
        OR: [
          { date: { lt: new Date(cursor.date) } },
          { date: new Date(cursor.date), id: { lt: cursor.id } },
        ],
      }),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      tags: true,
      todoItems: { select: { id: true, nodeId: true, checked: true, text: true } },
    },
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeRecordCursor({ date: last.date.toISOString(), id: last.id })
      : null;

  return NextResponse.json({
    items: page.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      createdAt: r.createdAt.toISOString(),
      content: r.content,
      tags: r.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      todoItems: r.todoItems,
    })),
    nextCursor,
  });
}
