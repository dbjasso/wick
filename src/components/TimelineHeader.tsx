"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { todayKey, shiftDayKey, formatDayKeyShort } from "@/lib/timezone";

export function TimelineHeader({ date }: { date: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/?date=${d}`);
  const isToday = date === todayKey();
  const short = formatDayKeyShort(date);
  const label = isToday ? `Hoy · ${short}` : short.charAt(0).toUpperCase() + short.slice(1);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-[34px] py-4">
      <div className="flex items-center gap-0.5 rounded-btn border border-border bg-surface p-0.5">
        <button
          type="button"
          onClick={() => go(shiftDayKey(date, -1))}
          aria-label="Día anterior"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-sm text-text-2 hover:bg-surface-2 hover:text-text"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => go(todayKey())}
          className="h-8 rounded-[6px] px-2 text-sm font-medium capitalize text-text hover:bg-surface-2"
          title="Ir a hoy"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => go(shiftDayKey(date, 1))}
          aria-label="Día siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-sm text-text-2 hover:bg-surface-2 hover:text-text"
        >
          ▶
        </button>
        <label
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-text-2 hover:bg-surface-2 hover:text-text"
          title="Saltar a fecha"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2.5 6.5h11M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && go(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Saltar a fecha"
          />
        </label>
      </div>

      <Link href="/registros/nuevo" className={buttonStyles("accent")}>
        ＋ Nuevo registro
      </Link>
    </header>
  );
}
