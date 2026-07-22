"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, X, CheckSquare, Square } from "lucide-react";
import { TagPill } from "@/components/ui/TagPill";
import { shortDate } from "@/lib/date-labels";

type Tag = { id: string; name: string; color: string | null };
type RecordHit = {
  id: string;
  date: string;
  title: string;
  snippet: { text: string; match: string };
  tags: Tag[];
};
type TodoHit = {
  id: string;
  text: string;
  checked: boolean;
  record: { id: string; date: string; title: string };
};

// Resalta (case-insensitive) todas las apariciones de `match` en `text`.
function Highlight({ text, match }: { text: string; match: string }) {
  if (!match) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const q = match.toLowerCase();
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={key++}
        className="rounded-sm bg-violet-100 px-0.5 font-medium text-stone-900"
      >
        {text.slice(idx, idx + match.length)}
      </mark>,
    );
    i = idx + match.length;
  }
  return <>{parts}</>;
}

export function BuscarView() {
  const [q, setQ] = useState("");
  const [tagId, setTagId] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [records, setRecords] = useState<RecordHit[]>([]);
  const [todos, setTodos] = useState<TodoHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTags(d?.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = q.trim();
    const ctrl = new AbortController();
    if (!query) {
      const t = setTimeout(() => {
        setRecords([]);
        setTodos([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: query, type: "all" });
      if (tagId) params.set("tagId", tagId);
      fetch(`/api/search?${params}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          setRecords(d?.records ?? []);
          setTodos(d?.todos ?? []);
          setLoading(false);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, tagId]);

  const hasQuery = q.trim().length > 0;
  const totalCount = records.length + todos.length;
  const empty = hasQuery && !loading && totalCount === 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <h1 className="pb-5 font-display text-3xl text-stone-900">Search</h1>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            placeholder="Search your entries…"
            className="w-full rounded-md border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-stone-900 shadow-sm placeholder:text-stone-300 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <span className="text-xs text-stone-400">Filter:</span>
            {tags.map((t) => {
              const active = tagId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTagId(active ? "" : t.id)}
                  className={`transition ${active ? "" : "opacity-50 hover:opacity-100"}`}
                >
                  <TagPill name={t.name} color={t.color} />
                </button>
              );
            })}
          </div>
        )}

        {!hasQuery ? (
          <div className="pt-16 text-center">
            <p className="font-display text-lg text-stone-400">
              Find anything you wrote
            </p>
            <p className="mt-1 text-sm text-stone-300">
              Titles, content, and to-dos across all your entries.
            </p>
          </div>
        ) : empty ? (
          <div className="pt-16 text-center">
            <p className="font-display text-lg text-stone-400">
              No results for “{q.trim()}”
            </p>
            <p className="mt-1 text-sm text-stone-300">
              Try a different word, or remove the tag filter.
            </p>
          </div>
        ) : (
          <div className="pt-6">
            {totalCount > 0 && (
              <p className="pb-2 text-xs text-stone-400">
                {totalCount} {totalCount === 1 ? "result" : "results"}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {records.map((r) => (
                <Link
                  key={r.id}
                  href={`/registros/${r.id}/editar`}
                  className="group rounded-md border border-stone-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <span className="shrink-0 text-xs tabular-nums text-stone-400">
                        {shortDate(r.date)}
                      </span>
                      <h3 className="truncate font-display text-[16px] text-stone-900">
                        <Highlight text={r.title} match={r.snippet.match} />
                      </h3>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
                    <Highlight text={r.snippet.text} match={r.snippet.match} />
                  </p>
                  {r.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <TagPill key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                  )}
                </Link>
              ))}

              {todos.map((t) => (
                <Link
                  key={t.id}
                  href={`/registros/${t.record.id}/editar`}
                  className="group flex items-center gap-3 rounded-md border border-stone-200/80 bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  {t.checked ? (
                    <CheckSquare className="h-4 w-4 shrink-0 text-stone-400" />
                  ) : (
                    <Square className="h-4 w-4 shrink-0 text-stone-300" />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      t.checked ? "text-stone-400 line-through" : "text-stone-800"
                    }`}
                  >
                    <Highlight text={t.text} match={q.trim()} />
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs tabular-nums text-stone-400 sm:flex">
                    {t.record.title || "Untitled"} · {shortDate(t.record.date)}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
