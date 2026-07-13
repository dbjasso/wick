import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { previewSegments } from "@/lib/tiptap-text";

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(["all", "records", "todos"]).optional(),
  tagId: z.string().optional(),
});

function snippet(text: string, q: string, radius = 60) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return {
    text: (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : ""),
    match: q,
  };
}

// GET /api/search?q=&type=all|records|todos&tagId=
export async function GET(request: Request) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? undefined,
    tagId: url.searchParams.get("tagId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ records: [], todos: [] });
  }
  const { q, tagId } = parsed.data;
  const type = parsed.data.type ?? "all";
  const tagFilter = tagId ? { tags: { some: { id: tagId } } } : {};

  const wantRecords = type === "all" || type === "records";
  const wantTodos = type === "all" || type === "todos";

  let records: Array<{ id: string; date: string; title: string; snippet: ReturnType<typeof snippet>; tags: { id: string; name: string; color: string | null }[] }> = [];
  if (wantRecords) {
    const like = `%${q}%`;
    const idRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT "id" FROM "Record" WHERE "content"::text ILIKE ${like} AND "accountId" = ${accountId} LIMIT 100`,
    );
    const ids = idRows.map((r) => r.id);
    if (ids.length) {
      const rows = await prisma.record.findMany({
        where: { id: { in: ids }, accountId, ...tagFilter },
        include: { tags: true },
        orderBy: { date: "desc" },
      });
      records = rows
        .map((r) => {
          const { title, segments } = previewSegments(r.content);
          const plain = title + " " + segments.map((s) => s.text).join(" ");
          const snip = snippet(plain, q);
          if (!snip) return null;
          return {
            id: r.id,
            date: r.date.toISOString(),
            title: title || "Sin título",
            snippet: snip,
            tags: r.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .slice(0, 50);
    }
  }

  let todos: Array<{ id: string; text: string; checked: boolean; record: { id: string; date: string; title: string } }> = [];
  if (wantTodos) {
    const rows = await prisma.todoItem.findMany({
      where: {
        text: { contains: q, mode: "insensitive" },
        record: { accountId, ...(tagId ? tagFilter : {}) },
      },
      include: { record: { include: { tags: true } } },
      orderBy: [{ record: { date: "desc" } }, { updatedAt: "desc" }],
      take: 50,
    });
    todos = rows.map((t) => ({
      id: t.id,
      text: t.text,
      checked: t.checked,
      record: {
        id: t.record.id,
        date: t.record.date.toISOString(),
        title: previewSegments(t.record.content).title || "Sin título",
      },
    }));
  }

  return NextResponse.json({ records, todos });
}
