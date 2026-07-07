"use client";

import { ArrowUpRight, CheckSquare } from "lucide-react";
import { TagPill, TagColor } from "./ui/TagPill";

export type EntryTag = { name: string; color: TagColor };

export function EntryCard({
  time = "11:37",
  title,
  excerpt,
  todosDone = 0,
  todosTotal = 0,
  tags = [],
  onOpen,
}: {
  time?: string;
  title?: string;
  excerpt?: string;
  todosDone?: number;
  todosTotal?: number;
  tags?: EntryTag[];
  onOpen?: () => void;
}) {
  return (
    <div className="group relative flex gap-3 md:gap-5">
      {/* Riel de tiempo */}
      <div className="flex w-10 shrink-0 flex-col items-end pt-4 md:w-12">
        <span className="text-xs font-medium tabular-nums text-stone-400">{time}</span>
      </div>
      <div className="relative hidden flex-col items-center sm:flex">
        <span className="mt-[21px] h-2 w-2 shrink-0 rounded-full border-2 border-stone-300 bg-white transition group-hover:border-violet-500" />
        <span className="w-px flex-1 bg-stone-200" />
      </div>

      {/* Tarjeta */}
      <button
        onClick={onOpen}
        className="mb-4 flex-1 rounded-md border border-stone-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[17px] leading-snug text-stone-900">
            {title || <span className="italic text-stone-400">Untitled</span>}
          </h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100" />
        </div>

        {excerpt && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">{excerpt}</p>
        )}

        {(todosTotal > 0 || tags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {todosTotal > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-stone-600">
                <CheckSquare className="h-3 w-3" />
                {todosDone}/{todosTotal}
              </span>
            )}
            {tags.map((t) => (
              <TagPill key={t.name} name={t.name} color={t.color} size="xs" />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
