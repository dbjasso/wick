import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { HomeView, type HomeEntry } from "@/components/HomeView";
import { previewSegments } from "@/lib/tiptap-text";
import { todayKey, dayBounds, formatTime } from "@/lib/timezone";
import { getJournalAccountId, pendingTodosWhere } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toHomeEntry(record: {
  id: string;
  date: Date;
  content: unknown;
  tags: { name: string; color: string | null }[];
  todoItems: { checked: boolean }[];
}): HomeEntry {
  const { title, segments } = previewSegments(record.content);
  const excerpt = segments
    .map((s) => s.text)
    .join(" ")
    .trim();

  return {
    id: record.id,
    time: formatTime(record.date.toISOString()),
    title: title || undefined,
    excerpt: excerpt || undefined,
    todosDone: record.todoItems.filter((t) => t.checked).length,
    todosTotal: record.todoItems.length,
    tags: record.tags.map((t) => ({ name: t.name, color: t.color })),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const accountId = await getJournalAccountId();
  if (!accountId) redirect("/admin/accounts");
  const { date: raw } = await searchParams;
  const date = raw && DATE_RE.test(raw) ? raw : todayKey();
  const { start, end } = dayBounds(date);

  const [records, pendingCount] = await Promise.all([
    prisma.record.findMany({
      where: { accountId, date: { gte: start, lte: end } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: { tags: true, todoItems: true },
      take: 100,
    }),
    prisma.todoItem.count({ where: pendingTodosWhere(accountId) }),
  ]);

  const entries = records.map(toHomeEntry);

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount} isAdmin={session?.user?.role === "ADMIN"}>
      <HomeView date={date} entries={entries} />
    </AppShell>
  );
}
