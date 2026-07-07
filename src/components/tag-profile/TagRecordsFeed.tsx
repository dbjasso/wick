"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckSquare } from "lucide-react";
import { previewSegments, previewText } from "@/lib/tiptap-text";
import { dayGroupLabel, dayKeyFromIso } from "@/lib/date-labels";
import { formatTime } from "@/lib/timezone";

type FeedRecord = {
  id: string;
  date: string;
  createdAt: string;
  content: unknown;
  tags: { id: string; name: string; color: string | null }[];
  todoItems: { id: string; nodeId: string; checked: boolean; text: string }[];
};

export type { FeedRecord };

export function TagRecordsFeed({
  tagId,
  initialRecords,
  initialCursor,
}: {
  tagId: string;
  initialRecords: FeedRecord[];
  initialCursor: string | null;
}) {
  const [records, setRecords] = useState<FeedRecord[]>(initialRecords);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(!initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await fetch(`/api/tags/${tagId}/records?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: FeedRecord[];
        nextCursor: string | null;
      };
      setRecords((prev) => (append ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setDone(!data.nextCursor);
    },
    [tagId],
  );

  useEffect(() => {
    if (done || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !loadingMore) {
          setLoadingMore(true);
          load(cursor, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, done, load, loadingMore]);

  const groups = useMemo(() => {
    const out = new Map<string, FeedRecord[]>();
    for (const r of records) {
      const key = dayKeyFromIso(r.date);
      const list = out.get(key) ?? [];
      list.push(r);
      out.set(key, list);
    }
    return out;
  }, [records]);

  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-400">
        No entries with this tag yet.
      </p>
    );
  }

  return (
    <div className="pt-6">
      {[...groups.entries()].map(([dateKey, groupRecords]) => (
        <section key={dateKey} className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">
            {dayGroupLabel(dateKey)}
          </h2>
          <div className="flex flex-col gap-2">
            {groupRecords.map((r) => {
              const { title, segments } = previewSegments(r.content);
              const excerpt =
                segments
                  .slice(0, 4)
                  .map((s) => s.text.replace(/^☐ /, ""))
                  .join(" · ") || previewText(r.content, 140);
              const todosDone = r.todoItems.filter((t) => t.checked).length;
              const todosTotal = r.todoItems.length;

              return (
                <Link
                  key={r.id}
                  href={`/registros/${r.id}/editar`}
                  className="group rounded-md border border-stone-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <span className="shrink-0 text-xs tabular-nums text-stone-400">
                        {formatTime(r.date)}
                      </span>
                      <h3 className="truncate font-display text-[16px] text-stone-900">
                        {title || "Untitled"}
                      </h3>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100" />
                  </div>
                  {excerpt && (
                    <p className="mt-1 line-clamp-2 pl-[42px] text-sm text-stone-500">
                      {excerpt}
                    </p>
                  )}
                  {todosTotal > 0 && (
                    <span className="ml-[42px] mt-2 inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-stone-600">
                      <CheckSquare className="h-3 w-3" />
                      {todosDone}/{todosTotal}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div ref={sentinelRef} className="py-4 text-center text-sm text-stone-400">
        {loadingMore && "Loading more…"}
        {!loadingMore && done && records.length > 0 && "No more entries"}
      </div>
    </div>
  );
}
