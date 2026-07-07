"use client";

import { Search, ArrowUpRight, X } from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";
import { TagPill, TagColor } from "../ui/TagPill";

/* Búsqueda global de registros.
   - Input grande autofocus, limpiar con ✕ o Esc
   - Resultados agrupados por fecha, con el match resaltado (<mark>)
   - Filtro rápido por tag (chips)
   - Estado inicial: hint de qué se puede buscar */

export type SearchResult = {
  id: string;
  date: string;      // "Mon, Jul 6"
  time: string;
  title: string;
  snippetBefore: string;
  match: string;     // texto que hizo match — se resalta
  snippetAfter: string;
  tag?: { name: string; color: TagColor };
};

const DEMO: SearchResult[] = [
  {
    id: "1", date: "Mon, Jul 6", time: "11:37", title: "Post 1",
    snippetBefore: "…Donec quam felis, ultricies nec, ",
    match: "pellentesque",
    snippetAfter: " eu, pretium quis, sem. Nulla consequat massa quis enim…",
    tag: { name: "leafland", color: "pink" },
  },
];

export function SearchScreen({
  query = "",
  results = DEMO,
  activeTags = [],
  availableTags = [{ name: "leafland", color: "pink" as TagColor }],
  pendingCount = 10,
  onQueryChange,
  onClear,
  onToggleTag,
  onOpenResult,
}: {
  query?: string;
  results?: SearchResult[];
  activeTags?: string[];
  availableTags?: { name: string; color: TagColor }[];
  pendingCount?: number;
  onQueryChange?: (q: string) => void;
  onClear?: () => void;
  onToggleTag?: (name: string) => void;
  onOpenResult?: (id: string) => void;
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="search" pendingCount={pendingCount} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <h1 className="font-display pb-5 text-3xl text-stone-900">Search</h1>

          {/* Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onClear?.()}
              placeholder="Search your entries…"
              className="w-full rounded-md border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-stone-900 shadow-sm placeholder:text-stone-300 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            {hasQuery && (
              <button onClick={onClear} aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro por tag */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3">
              <span className="text-xs text-stone-400">Filter:</span>
              {availableTags.map((t) => {
                const active = activeTags.includes(t.name);
                return (
                  <button key={t.name} onClick={() => onToggleTag?.(t.name)}
                    className={`transition ${active ? "" : "opacity-50 hover:opacity-100"}`}>
                    <TagPill name={t.name} color={t.color} size="xs" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Resultados */}
          {!hasQuery ? (
            <div className="pt-16 text-center">
              <p className="font-display text-lg text-stone-400">Find anything you wrote</p>
              <p className="mt-1 text-sm text-stone-300">Titles, content, and to-dos across all your entries.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="pt-16 text-center">
              <p className="font-display text-lg text-stone-400">No results for “{query}”</p>
              <p className="mt-1 text-sm text-stone-300">Try a different word, or remove the tag filter.</p>
            </div>
          ) : (
            <div className="pt-6">
              <p className="pb-2 text-xs text-stone-400">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
              <div className="flex flex-col gap-2">
                {results.map((r) => (
                  <button key={r.id} onClick={() => onOpenResult?.(r.id)}
                    className="group rounded-md border border-stone-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-xs tabular-nums text-stone-400">{r.date} · {r.time}</span>
                        <h3 className="font-display text-[16px] text-stone-900">{r.title}</h3>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                      {r.snippetBefore}
                      <mark className="rounded-sm bg-violet-100 px-0.5 font-medium text-stone-900">{r.match}</mark>
                      {r.snippetAfter}
                    </p>
                    {r.tag && (
                      <span className="mt-2 inline-flex">
                        <TagPill name={r.tag.name} color={r.tag.color} size="xs" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav active="search" pendingCount={pendingCount} />
    </div>
  );
}
