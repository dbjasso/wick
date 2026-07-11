"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { dayGroupLabel, dayKeyFromIso } from "@/lib/date-labels";
import { formatTime } from "@/lib/timezone";
import { RecordContent } from "./RecordContent";

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

  async function toggleTodo(todoId: string, checked: boolean) {
    setRecords((rs) =>
      rs.map((r) => ({
        ...r,
        todoItems: r.todoItems.map((t) => (t.id === todoId ? { ...t, checked } : t)),
      })),
    );
    const res = await fetch(`/api/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
    if (!res.ok) {
      setRecords((rs) =>
        rs.map((r) => ({
          ...r,
          todoItems: r.todoItems.map((t) =>
            t.id === todoId ? { ...t, checked: !checked } : t,
          ),
        })),
      );
    }
  }

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
            {groupRecords.map((r) => (
              <article
                key={r.id}
                className="rounded-md border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs tabular-nums text-stone-400">
                    {formatTime(r.date)}
                  </span>
                  <Link
                    href={`/registros/${r.id}/editar`}
                    className="rounded p-1 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
                    aria-label="Open entry"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <RecordContent
                  content={r.content}
                  todoItems={r.todoItems}
                  onTodoToggle={(todoId, checked) => void toggleTodo(todoId, checked)}
                />
              </article>
            ))}
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
