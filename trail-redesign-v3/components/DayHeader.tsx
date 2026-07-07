"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

/* Cabecera editorial del día — elemento firma del rediseño. */

export function DayHeader({
  weekday = "Monday",
  dayNumber = 6,
  monthYear = "July 2026",
  isToday = true,
  entryCount = 0,
  onPrev,
  onNext,
  onToday,
  onOpenCalendar,
}: {
  weekday?: string;
  dayNumber?: number;
  monthYear?: string;
  isToday?: boolean;
  entryCount?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onOpenCalendar?: () => void;
}) {
  return (
    <header className="flex items-end justify-between pb-6 pt-2 md:pb-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400">
          {monthYear}
          {isToday && (
            <span className="rounded bg-violet-50 px-2 py-0.5 normal-case tracking-normal text-violet-700">
              Today
            </span>
          )}
        </div>
        <h1 className="font-display mt-1 text-3xl text-stone-900 md:text-4xl">
          {weekday} {dayNumber}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {entryCount === 0
            ? "No entries yet"
            : entryCount === 1
            ? "1 entry"
            : `${entryCount} entries`}
        </p>
      </div>

      <div className="flex items-center gap-0.5 pb-1 md:gap-1">
        {!isToday && (
          <button
            onClick={onToday}
            className="mr-1 rounded-md px-2.5 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            Today
          </button>
        )}
        <button onClick={onPrev} aria-label="Previous day"
          className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={onNext} aria-label="Next day"
          className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={onOpenCalendar} aria-label="Open calendar"
          className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900">
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
