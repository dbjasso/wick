"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export function DayHeader({
  weekday = "Monday",
  dayNumber = 6,
  monthYear = "July 2026",
  isToday = true,
  entryCount = 0,
  dateValue,
  onPrev,
  onNext,
  onToday,
  onPickDate,
}: {
  weekday?: string;
  dayNumber?: number;
  monthYear?: string;
  isToday?: boolean;
  entryCount?: number;
  dateValue?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onPickDate?: (date: string) => void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex items-end justify-between pb-6 pt-2 md:pb-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400">
          {monthYear}
          {isToday && (
            <span className="rounded-sm bg-violet-50 px-2 py-0.5 normal-case tracking-normal text-violet-700">
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
            type="button"
            onClick={onToday}
            className="mr-1 rounded-md px-2.5 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous day"
          className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next day"
          className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
          aria-label="Open calendar"
          className="relative rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <CalendarDays className="h-5 w-5" />
          <input
            ref={dateInputRef}
            type="date"
            value={dateValue}
            onChange={(e) => e.target.value && onPickDate?.(e.target.value)}
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </button>
      </div>
    </header>
  );
}
