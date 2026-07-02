"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TagPill } from "@/components/ui/TagPill";
import { RecordContent } from "./RecordContent";
import { previewSegments } from "@/lib/tiptap-text";
import { dayKeyFromIso, dayLabel } from "@/lib/date-labels";
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

  const toggleTodo = useCallback(
    async (recordId: string, todoId: string, checked: boolean) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r;
          const todoItems = r.todoItems.map((t) =>
            t.id === todoId ? { ...t, checked } : t,
          );
          const content = patchContentTodo(r.content, todoItems);
          return { ...r, todoItems, content };
        }),
      );
      const res = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      });
      if (!res.ok) {
        setRecords((prev) =>
          prev.map((r) => {
            if (r.id !== recordId) return r;
            const todoItems = r.todoItems.map((t) =>
              t.id === todoId ? { ...t, checked: !checked } : t,
            );
            return { ...r, todoItems, content: patchContentTodo(r.content, todoItems) };
          }),
        );
      }
    },
    [],
  );

  const rows = useMemo(() => {
    const out: Array<
      { kind: "day"; key: string } | { kind: "record"; record: FeedRecord }
    > = [];
    let prev = "";
    for (const r of records) {
      const dk = dayKeyFromIso(r.date);
      if (dk !== prev) {
        out.push({ kind: "day", key: dk });
        prev = dk;
      }
      out.push({ kind: "record", record: r });
    }
    return out;
  }, [records]);

  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-3">
        Este tag aún no tiene registros.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        if (row.kind === "day") {
          return (
            <div
              key={`day-${row.key}`}
              className="sticky top-0 z-10 -mx-1 bg-bg/95 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-text-3 backdrop-blur-sm"
            >
              {dayLabel(row.key)}
            </div>
          );
        }
        const r = row.record;
        const { title } = previewSegments(r.content);
        return (
          <article
            key={r.id}
            className="rounded-card border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs tabular-nums text-text-3">
                  {formatTime(r.date)}
                  {title && (
                    <span className="ml-2 font-semibold text-text">{title}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/registros/${r.id}/editar`}
                className="shrink-0 text-xs font-medium text-text-2 hover:text-text"
              >
                Abrir en editor →
              </Link>
            </div>
            <div className="text-sm text-text">
              <RecordContent
                content={r.content}
                todoItems={r.todoItems}
                onTodoToggle={(todoId, checked) => toggleTodo(r.id, todoId, checked)}
              />
            </div>
            {r.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {r.tags.map((t) => (
                  <TagPill key={t.id} name={t.name} color={t.color} />
                ))}
              </div>
            )}
          </article>
        );
      })}

      <div ref={sentinelRef} className="py-4 text-center text-sm text-text-3">
        {loadingMore && "Cargando más registros…"}
        {!loadingMore && done && records.length > 0 && "No hay más registros"}
      </div>
    </div>
  );
}

// ponytail: parchea checked en el JSON local tras toggle optimista.
function patchContentTodo(
  content: unknown,
  todoItems: { nodeId: string; checked: boolean }[],
): unknown {
  const map = Object.fromEntries(todoItems.map((t) => [t.nodeId, t.checked]));
  function walk(node: unknown): unknown {
    if (!node || typeof node !== "object") return node;
    const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };
    if (n.type === "taskItem" && typeof n.attrs?.nodeId === "string") {
      const id = n.attrs.nodeId;
      if (id in map) {
        return { ...n, attrs: { ...n.attrs, checked: map[id] } };
      }
    }
    if (Array.isArray(n.content)) {
      return { ...n, content: n.content.map(walk) };
    }
    return node;
  }
  return walk(content);
}
