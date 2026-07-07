"use client";

import { PenLine } from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";
import { DayHeader } from "../DayHeader";
import { EntryCard, EntryTag } from "../EntryCard";

export type Entry = {
  id: string;
  time: string;
  title?: string;
  excerpt?: string;
  todosDone: number;
  todosTotal: number;
  tags: EntryTag[];
};

const DEMO: Entry[] = [
  {
    id: "1",
    time: "11:37",
    title: "Post 1",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes.",
    todosDone: 0,
    todosTotal: 3,
    tags: [{ name: "leafland", color: "pink" }],
  },
];

export function HomeScreen({
  entries = DEMO,
  pendingCount = 10,
  onNewEntry,
  onOpenEntry,
}: {
  entries?: Entry[];
  pendingCount?: number;
  onNewEntry?: () => void;
  onOpenEntry?: (id: string) => void;
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="home" pendingCount={pendingCount} onNewEntry={onNewEntry} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <DayHeader entryCount={entries.length} />

          {entries.length === 0 ? (
            <button
              onClick={onNewEntry}
              className="group flex w-full flex-col items-center gap-3 rounded-md border border-stone-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition group-hover:bg-violet-50 group-hover:text-violet-600">
                <PenLine className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg text-stone-800">What happened today?</p>
                <p className="mt-1 text-sm text-stone-400">
                  Write your first entry of the day
                  <span className="ml-2 hidden rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-400 md:inline">N</span>
                </p>
              </div>
            </button>
          ) : (
            <div>
              {entries.map((e) => (
                <EntryCard
                  key={e.id}
                  time={e.time}
                  title={e.title}
                  excerpt={e.excerpt}
                  todosDone={e.todosDone}
                  todosTotal={e.todosTotal}
                  tags={e.tags}
                  onOpen={() => onOpenEntry?.(e.id)}
                />
              ))}

              <div className="flex gap-3 md:gap-5">
                <div className="w-10 shrink-0 md:w-12" />
                <div className="hidden w-2 justify-center sm:flex">
                  <span className="h-2 w-2 rounded-full border-2 border-dashed border-stone-300 bg-white" />
                </div>
                <button
                  onClick={onNewEntry}
                  className="flex-1 rounded-md border border-dashed border-stone-300 px-4 py-3 text-left text-sm text-stone-400 transition hover:border-stone-400 hover:text-stone-600"
                >
                  + Add entry
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav active="home" pendingCount={pendingCount} onNewEntry={onNewEntry} />
    </div>
  );
}
