"use client";

import { useRef } from "react";
import { CalendarPlus } from "lucide-react";

/* Botón de fecha de ejecución para to-dos.
   - Sin fecha: icono de calendario (se ilumina al hover)
   - Con fecha: chip "Jul 8" — rojo si está vencida
   Usa el date picker nativo (showPicker) — cero dependencias.
   Se usa al inicio de cada to-do en el editor y en cada fila de Pendientes. */

export function DueDateButton({
  value,
  onChange,
  align = "start",
}: {
  value: string | null; // ISO "2026-07-08"
  onChange?: (v: string | null) => void;
  align?: "start" | "end";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    const el = inputRef.current;
    if (!el) return;
    // @ts-expect-error showPicker no está en todos los tipos aún
    el.showPicker ? el.showPicker() : el.click();
  };

  const isOverdue =
    !!value && new Date(value + "T23:59:59") < new Date();

  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <span className={`relative inline-flex ${align === "end" ? "justify-end" : ""}`}>
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
      {value ? (
        <button
          onClick={open}
          title="Change due date"
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition ${
            isOverdue
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {label}
        </button>
      ) : (
        <button
          onClick={open}
          title="Set due date"
          aria-label="Set due date"
          className="rounded p-1 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
