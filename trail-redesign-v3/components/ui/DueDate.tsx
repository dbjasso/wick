"use client";

import { useRef } from "react";
import { CalendarPlus, CalendarDays } from "lucide-react";

/* Due date control for to-dos.
   Used in two places: the TipTap task item node view (editor)
   and each row of the To-dos screen. Wraps a native date input
   so the OS picker does the work. */

function formatDue(iso: string, locale = "en-US") {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function isOverdue(iso: string) {
  return new Date(iso + "T23:59:59") < new Date();
}

export function DueDate({
  value,
  onChange,
  locale = "en-US",
}: {
  value?: string | null; // ISO date "2026-07-10"
  onChange?: (iso: string | null) => void;
  locale?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const overdue = value ? isOverdue(value) : false;

  return (
    <span className="relative inline-flex">
      {value ? (
        <button
          onClick={() => inputRef.current?.showPicker()}
          title="Change due date"
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition ${
            overdue
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          <CalendarDays className="h-3 w-3" />
          {formatDue(value, locale)}
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.showPicker()}
          title="Set due date"
          aria-label="Set due date"
          className="rounded p-0.5 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="pointer-events-none absolute inset-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </span>
  );
}
