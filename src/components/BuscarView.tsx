"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TagPill } from "@/components/ui/TagPill";
import { EmptyState } from "@/components/ui/EmptyState";
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

type SearchType = "all" | "records" | "todos";

const TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "records", label: "Registros" },
  { value: "todos", label: "To-do's" },
];

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
      <mark key={key++} className="rounded bg-accent/20 text-text">
        {text.slice(idx, idx + match.length)}
      </mark>,
    );
    i = idx + match.length;
  }
  return <>{parts}</>;
}

export function BuscarView() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("all");
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
      // Limpiar de forma asíncrona evita setState síncrono en el cuerpo del effect.
      const t = setTimeout(() => {
        setRecords([]);
        setTodos([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: query, type });
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
  }, [q, type, tagId]);

  const hasQuery = q.trim().length > 0;
  const empty = hasQuery && !loading && records.length === 0 && todos.length === 0;

  return (
    <main className="flex-1 px-[34px] py-[26px]">
      <div className="mx-auto max-w-[860px]">
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en registros y to-do's…"
          className="w-full rounded-btn border border-border-strong bg-surface px-4 py-3 text-lg text-text placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((o) => {
              const active = type === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={`rounded-pill border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-text bg-surface-2 text-text"
                      : "border-border bg-surface text-text-2 hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          {tags.length > 0 && (
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="h-9 rounded-btn border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Filtrar por tag"
            >
              <option value="">Todos los tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-6">
          {!hasQuery && (
            <p className="text-sm text-text-3">
              Escribí para buscar en tus registros y to-do&apos;s.
            </p>
          )}

          {empty && (
            <EmptyState
              title={`Sin resultados para “${q.trim()}”.`}
              help="Probá otras palabras o cambiá los filtros."
            />
          )}

          {records.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
                Registros
              </h2>
              <ul className="divide-y divide-border rounded-card border border-border bg-surface">
                {records.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/registros/${r.id}/editar`}
                      className="block px-4 py-3 hover:bg-surface-2"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium text-text">
                          <Highlight text={r.title} match={r.snippet.match} />
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-text-3">
                          {shortDate(r.date)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-text-2">
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
                  </li>
                ))}
              </ul>
            </section>
          )}

          {todos.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
                To-do&apos;s
              </h2>
              <ul className="divide-y divide-border rounded-card border border-border bg-surface">
                {todos.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-text-3">{t.checked ? "☑" : "☐"}</span>
                    <span
                      className={`min-w-0 flex-1 text-sm ${
                        t.checked ? "text-text-3 line-through" : "text-text"
                      }`}
                    >
                      <Highlight text={t.text} match={q.trim()} />
                    </span>
                    <Link
                      href={`/registros/${t.record.id}/editar`}
                      className="shrink-0 text-xs tabular-nums text-text-2 hover:text-text"
                    >
                      {shortDate(t.record.date)} · {t.record.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
