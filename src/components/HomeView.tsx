"use client";

import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { DayHeader } from "@/components/DayHeader";
import { EntryCard, type EntryTag } from "@/components/EntryCard";
import { formatDayHeader, shiftDayKey, todayKey } from "@/lib/timezone";

export type HomeEntry = {
  id: string;
  time: string;
  title?: string;
  excerpt?: string;
  todosDone: number;
  todosTotal: number;
  tags: EntryTag[];
};

export function HomeView({ date, entries }: { date: string; entries: HomeEntry[] }) {
  const router = useRouter();
  const isToday = date === todayKey();
  const { weekday, dayNumber, monthYear } = formatDayHeader(date);

  const goDate = (d: string) => router.push(d === todayKey() ? "/" : `/?date=${d}`);
  const openEntry = (id: string) => router.push(`/registros/${id}/editar`);
  const newEntry = () => router.push("/registros/nuevo");

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <DayHeader
          weekday={weekday}
          dayNumber={dayNumber}
          monthYear={monthYear}
          isToday={isToday}
          entryCount={entries.length}
          dateValue={date}
          onPrev={() => goDate(shiftDayKey(date, -1))}
          onNext={() => goDate(shiftDayKey(date, 1))}
          onToday={() => goDate(todayKey())}
          onPickDate={goDate}
        />

        {entries.length === 0 ? (
          <button
            type="button"
            onClick={newEntry}
            className="group flex w-full flex-col items-center gap-3 rounded-md border border-stone-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-100 text-stone-400 transition group-hover:bg-violet-50 group-hover:text-violet-600">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg text-stone-800">What happened today?</p>
              <p className="mt-1 text-sm text-stone-400">Write your first entry of the day</p>
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
                onOpen={() => openEntry(e.id)}
              />
            ))}

            <div className="flex gap-3 md:gap-5">
              <div className="w-10 shrink-0 md:w-12" />
              <div className="hidden w-2 justify-center sm:flex">
                <span className="h-2 w-2 rounded-full border-2 border-dashed border-stone-300 bg-white" />
              </div>
              <button
                type="button"
                onClick={newEntry}
                className="flex-1 rounded-md border border-dashed border-stone-300 px-4 py-3 text-left text-sm text-stone-400 transition hover:border-stone-400 hover:text-stone-600"
              >
                + Add entry
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
