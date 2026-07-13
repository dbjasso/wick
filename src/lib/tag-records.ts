import { prisma } from "@/lib/prisma";
import { encodeRecordCursor } from "@/lib/record-cursor";

const PAGE = 20;

export async function fetchTagRecordsPage(tagId: string, accountId: string, limit = PAGE) {
  const items = await prisma.record.findMany({
    where: { accountId, tags: { some: { id: tagId } } },
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

  return {
    items: page.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      createdAt: r.createdAt.toISOString(),
      content: r.content,
      tags: r.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      todoItems: r.todoItems,
    })),
    nextCursor,
  };
}
