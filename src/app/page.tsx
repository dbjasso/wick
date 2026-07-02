import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TagPill } from "@/components/ui/TagPill";
import { Sidebar } from "@/components/ui/Sidebar";
import { TimelineHeader } from "@/components/TimelineHeader";
import { RecordPreview } from "@/components/RecordPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { todayKey, dayBounds, formatTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const { date: raw } = await searchParams;
  const date = raw && DATE_RE.test(raw) ? raw : todayKey();
  const { start, end } = dayBounds(date);

  const [records, pendingCount] = await Promise.all([
    prisma.record.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { tags: true },
      take: 100,
    }),
    prisma.todoItem.count({ where: { checked: false } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session?.user?.email} pendingCount={pendingCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TimelineHeader date={date} />
        <main className="flex-1 px-[34px] py-[26px]">
          <ul className="mx-auto max-w-[860px] space-y-3">
            {records.map((r) => (
              <li key={r.id}>
                <div className="rounded-card border border-border bg-surface transition-colors hover:border-border-strong">
                  <Link
                    href={`/registros/${r.id}/editar`}
                    className="block px-4 py-3"
                  >
                    <div className="mb-1 text-xs tabular-nums text-text-3">
                      {formatTime(r.date.toISOString())}
                    </div>
                    <RecordPreview content={r.content} />
                  </Link>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
                      {r.tags.map((t) => (
                        <TagPill
                          key={t.id}
                          name={t.name}
                          color={t.color}
                          href={`/tags/${encodeURIComponent(t.name)}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
            {records.length === 0 && (
              <li>
                <EmptyState
                  title="Sin registros para esta fecha."
                  help="Crea el primero con 'Nuevo registro'."
                />
              </li>
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}
