import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { previewSegments } from "@/lib/tiptap-text";
import { repairTodoDueDates } from "@/lib/todos";

const querySchema = z.object({
  status: z.enum(["pending", "done", "all"]).optional(),
  tagId: z.string().optional(),
});

function recordWhere(accountId: string, tagId?: string) {
  return tagId
    ? { record: { accountId, tags: { some: { id: tagId } } } }
    : { record: { accountId } };
}

// GET /api/todos?status=pending|done|all&tagId=...
export async function GET(request: Request) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    tagId: url.searchParams.get("tagId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { status, tagId } = parsed.data;
  const tagFilter = recordWhere(accountId, tagId);

  const where: {
    checked?: boolean;
    record?: { accountId: string; tags?: { some: { id: string } } };
  } = { ...tagFilter };
  if (status === "pending") where.checked = false;
  else if (status === "done") where.checked = true;

  let todos = await prisma.todoItem.findMany({
    where,
    orderBy: [
      { sortOrder: { sort: "asc", nulls: "last" } },
      { dueDate: "asc" },
      { record: { date: "desc" } },
      { updatedAt: "desc" },
    ],
    include: {
      record: { include: { tags: true } },
    },
    take: 200,
  });

  const [openCount, doneCount, allCount] = await Promise.all([
    prisma.todoItem.count({ where: { checked: false, ...tagFilter } }),
    prisma.todoItem.count({ where: { checked: true, ...tagFilter } }),
    prisma.todoItem.count({ where: { ...tagFilter } }),
  ]);

  const staleIds = todos.filter((t) => !t.dueDate).map((t) => t.id);
  if (staleIds.length) {
    await repairTodoDueDates([...new Set(todos.filter((t) => !t.dueDate).map((t) => t.recordId))]);
    const patched = await prisma.todoItem.findMany({
      where: { id: { in: staleIds } },
      select: { id: true, dueDate: true },
    });
    const dueById = new Map(patched.map((p) => [p.id, p.dueDate]));
    todos = todos.map((t) =>
      !t.dueDate && dueById.has(t.id) ? { ...t, dueDate: dueById.get(t.id) ?? null } : t,
    );
  }

  return NextResponse.json({
    items: todos.map((t) => ({
      id: t.id,
      nodeId: t.nodeId,
      text: t.text,
      checked: t.checked,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      record: {
        id: t.record.id,
        date: t.record.date.toISOString(),
        title: previewSegments(t.record.content).title || "Sin título",
        tags: t.record.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        })),
      },
    })),
    counts: { open: openCount, done: doneCount, all: allCount },
  });
}
