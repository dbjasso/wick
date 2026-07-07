"use client";

import { ChevronDown, ArrowUpRight } from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";
import { TagPill, TagColor } from "../ui/TagPill";
import { DueDateButton } from "../ui/DueDateButton";

/* To-dos globales (antes "Pendientes").
   Cada fila tiene fecha de ejecución editable (DueDateButton) —
   misma fecha que se asigna desde el editor; editable en ambos lados. */

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string | null; // ISO "2026-07-08"
  tag: { name: string; color: TagColor };
  sourceTitle: string; // "Post 1"
  sourceDate: string;  // "Jul 6"
};

export type TodoGroup = { label: string; todos: Todo[] };

const DEMO: TodoGroup[] = [
  {
    label: "Today",
    todos: [
      { id: "1", text: "to do 3", done: false, dueDate: "2026-07-06", tag: { name: "leafland", color: "pink" }, sourceTitle: "Post 1", sourceDate: "Jul 6" },
      { id: "2", text: "to do 2", done: false, dueDate: null, tag: { name: "leafland", color: "pink" }, sourceTitle: "Post 1", sourceDate: "Jul 6" },
      { id: "3", text: "to do 1", done: false, dueDate: null, tag: { name: "leafland", color: "pink" }, sourceTitle: "Post 1", sourceDate: "Jul 6" },
    ],
  },
  {
    label: "This week",
    todos: [
      { id: "4", text: "Optional: decide whether to invoice", done: false, dueDate: "2026-07-03", tag: { name: "leafland", color: "pink" }, sourceTitle: "Leafland", sourceDate: "Jul 2" },
      { id: "5", text: "Unit price + VAT (if applicable)", done: false, dueDate: null, tag: { name: "leafland", color: "pink" }, sourceTitle: "Leafland", sourceDate: "Jul 2" },
      { id: "6", text: "Different price list per customer type", done: false, dueDate: null, tag: { name: "leafland", color: "pink" }, sourceTitle: "Leafland", sourceDate: "Jul 2" },
      { id: "7", text: "Track shipping status changes", done: false, dueDate: null, tag: { name: "leafland", color: "pink" }, sourceTitle: "Leafland", sourceDate: "Jul 2" },
    ],
  },
];

export function TodosScreen({
  groups = DEMO,
  filter = "open",
  counts = { open: 10, done: 0 },
  tagFilterLabel = "All tags",
  onToggle,
  onDueDateChange,
  onFilterChange,
  onOpenSource,
}: {
  groups?: TodoGroup[];
  filter?: "open" | "done" | "all";
  counts?: { open: number; done: number };
  tagFilterLabel?: string;
  onToggle?: (id: string, done: boolean) => void;
  onDueDateChange?: (id: string, dueDate: string | null) => void;
  onFilterChange?: (f: "open" | "done" | "all") => void;
  onOpenSource?: (todoId: string) => void;
}) {
  const total = counts.open + counts.done;

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="todos" pendingCount={counts.open} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <header className="pb-6">
            <h1 className="font-display text-3xl text-stone-900">To-dos</h1>
            <p className="mt-1 text-sm text-stone-400">
              From all your entries, in one place. Check here and the original updates too.
            </p>
          </header>

          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-6">
            <div className="flex rounded-md border border-stone-200 bg-white p-0.5 shadow-sm">
              {([
                ["open", `Open · ${counts.open}`],
                ["done", `Done · ${counts.done}`],
                ["all", `All · ${total}`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => onFilterChange?.(key)}
                  className={`rounded px-3 py-1.5 text-sm transition ${
                    filter === key
                      ? "bg-stone-900 font-medium text-white"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 shadow-sm transition hover:border-stone-300">
              {tagFilterLabel}
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
          </div>

          {/* Grupos */}
          {groups.map((g) => (
            <section key={g.label} className="mb-7">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">
                {g.label}
              </h2>
              <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                {g.todos.map((t) => (
                  <div key={t.id} className="group flex items-center gap-3 px-3 py-3 md:px-4">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => onToggle?.(t.id, e.target.checked)}
                      aria-label={t.text}
                      className="h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-sm border-[1.5px] border-stone-300 transition checked:border-stone-900 checked:bg-stone-900 hover:border-stone-400"
                    />
                    <span className={`min-w-0 flex-1 truncate text-sm ${t.done ? "text-stone-400 line-through" : "text-stone-800"}`}>
                      {t.text}
                    </span>

                    {/* Fecha de ejecución — editable aquí y en el editor */}
                    <DueDateButton
                      value={t.dueDate}
                      onChange={(v) => onDueDateChange?.(t.id, v)}
                    />

                    {/* Fuente al hover (oculta en mobile por espacio) */}
                    <button
                      onClick={() => onOpenSource?.(t.id)}
                      className="hidden items-center gap-1 text-xs text-stone-400 opacity-0 transition hover:text-stone-700 group-hover:opacity-100 md:flex"
                    >
                      {t.sourceTitle} · {t.sourceDate}
                      <ArrowUpRight className="h-3 w-3" />
                    </button>

                    <span className="hidden sm:inline-flex">
                      <TagPill name={t.tag.name} color={t.tag.color} size="xs" />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <MobileNav active="todos" pendingCount={counts.open} />
    </div>
  );
}
