"use client";

import { useRef } from "react";
import { CalendarPlus } from "lucide-react";

// Botón de fecha de ejecución para to-dos.
// - Sin fecha: icono calendario (visible al hover de la fila en el editor).
// - Con fecha: badge apilado mes/día (ej. Jul / 8), rojo si vencida.
export function DueDateButton({
  value,
  onChange,
}: {
  value: string | null; // "YYYY-MM-DD"
  onChange?: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };

  const isOverdue = !!value && new Date(value + "T23:59:59") < new Date();

  const parts = value
    ? (() => {
        const d = new Date(value + "T00:00:00");
        return {
          month: d.toLocaleDateString("en-US", { month: "short" }),
          day: d.getDate(),
        };
      })()
    : null;

  return (
    <span className="relative inline-flex" contentEditable={false}>
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
      {value && parts ? (
        <button
          type="button"
          onClick={open}
          title="Change due date"
          className={`flex min-w-[1.75rem] flex-col items-center rounded px-1 py-0.5 leading-none transition ${
            isOverdue
              ? "bg-red-50 hover:bg-red-100"
              : "bg-stone-100 hover:bg-stone-200"
          }`}
        >
          <span
            className={`text-[9px] font-medium ${isOverdue ? "text-red-500" : "text-stone-500"}`}
          >
            {parts.month}
          </span>
          <span
            className={`text-[11px] font-semibold tabular-nums ${
              isOverdue ? "text-red-600" : "text-stone-700"
            }`}
          >
            {parts.day}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          title="Set due date"
          aria-label="Set due date"
          className="rounded p-0.5 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
