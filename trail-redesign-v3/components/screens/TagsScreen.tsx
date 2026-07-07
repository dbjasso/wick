"use client";

import { Plus, ChevronRight } from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";
import { TagColor } from "../ui/TagPill";

export type TagSummary = {
  id: string;
  name: string;
  color: TagColor;
  count: number;
  description?: string;
  lastActivity?: string; // "2m ago", "Jul 2"
};

const DOT: Record<TagColor, string> = {
  pink: "bg-pink-500", violet: "bg-violet-500", blue: "bg-blue-500",
  green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500",
};

const DEMO: TagSummary[] = [
  { id: "1", name: "leafland", color: "pink", count: 2, lastActivity: "2m ago" },
];

export function TagsScreen({
  tags = DEMO,
  pendingCount = 10,
  onNewTag,
  onOpenTag,
}: {
  tags?: TagSummary[];
  pendingCount?: number;
  onNewTag?: () => void;
  onOpenTag?: (id: string) => void;
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="tags" pendingCount={pendingCount} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <header className="flex items-end justify-between pb-6 md:pb-8">
            <div>
              <h1 className="font-display text-3xl text-stone-900">Tags</h1>
              <p className="mt-1 text-sm text-stone-400">
                Each tag has a profile: contacts, dates and documents.
              </p>
            </div>
            <button
              onClick={onNewTag}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
            >
              <Plus className="h-4 w-4" />
              New tag
            </button>
          </header>

          <div className="flex flex-col gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => onOpenTag?.(t.id)}
                className="group flex items-center gap-3.5 rounded-md border border-stone-200/80 bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[t.color]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-stone-900">{t.name}</span>
                    {t.lastActivity && (
                      <span className="text-xs text-stone-400">last {t.lastActivity}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-stone-400">
                    {t.description || "Add a description…"}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-stone-400">
                  {t.count} {t.count === 1 ? "entry" : "entries"}
                </span>
                <ChevronRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500" />
              </button>
            ))}
          </div>

          {tags.length === 0 && (
            <button
              onClick={onNewTag}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-stone-200/80 bg-white px-8 py-12 text-center transition hover:border-stone-300"
            >
              <p className="font-display text-lg text-stone-800">Organize with tags</p>
              <p className="text-sm text-stone-400">Create your first one to group entries by project or topic.</p>
            </button>
          )}
        </div>
      </main>

      <MobileNav active="tags" pendingCount={pendingCount} />
    </div>
  );
}
