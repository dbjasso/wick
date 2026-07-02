import {
  todayKey,
  dayKeyFromIso,
  dayBounds,
  formatDayKeyShort,
  formatShortDateFromIso,
} from "@/lib/timezone";

export { todayKey, dayKeyFromIso } from "@/lib/timezone";

// "Hoy · jue 2 jul" o "Mar 30 jun" (uppercase primera letra si no es hoy).
export function dayLabel(dateKey: string): string {
  const short = formatDayKeyShort(dateKey);
  if (dateKey === todayKey()) return `Hoy · ${short}`;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function relTimeAgo(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

export function shortDate(iso: string): string {
  return formatShortDateFromIso(iso);
}

export type RecencyGroup = "hoy" | "semana" | "anteriores";

export function recencyGroup(recordDateIso: string): RecencyGroup {
  const dk = dayKeyFromIso(recordDateIso);
  if (dk === todayKey()) return "hoy";
  const record = dayBounds(dk).start.getTime();
  const today = dayBounds(todayKey()).start.getTime();
  const diffDays = Math.abs(today - record) / 86_400_000;
  if (diffDays < 7) return "semana";
  return "anteriores";
}

export const RECENCY_LABELS: Record<RecencyGroup, string> = {
  hoy: "Hoy",
  semana: "Esta semana",
  anteriores: "Anteriores",
};
