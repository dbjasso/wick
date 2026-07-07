import {
  todayKey,
  dayKeyFromIso,
  dayBounds,
  formatDayKeyShort,
  formatShortDateFromIso,
  formatDayHeader,
} from "@/lib/timezone";

export { todayKey, dayKeyFromIso } from "@/lib/timezone";

// "Today · Mon, Jul 6" or "Thu, Jul 2"
export function dayGroupLabel(dateKey: string): string {
  const { weekday, dayNumber, monthYear } = formatDayHeader(dateKey);
  const month = monthYear.split(" ")[0] ?? "";
  const label = `${weekday.slice(0, 3)}, ${month.slice(0, 3)} ${dayNumber}`;
  return dateKey === todayKey() ? `Today · ${label}` : label;
}

/** @deprecated use dayGroupLabel */
export function dayLabel(dateKey: string): string {
  return dayGroupLabel(dateKey);
}

export function relTimeAgo(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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

export type TodoBucket = "overdue" | "today" | "week" | "later" | "none";

export const TODO_BUCKET_ORDER: TodoBucket[] = [
  "overdue",
  "today",
  "week",
  "later",
  "none",
];

export const TODO_BUCKET_LABELS: Record<TodoBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "This week",
  later: "Later",
  none: "No due date",
};

// Clasifica un to-do en un bucket. Con due date ("YYYY-MM-DD") manda la fecha
// de ejecución: vencida / hoy / esta semana (próximos 7 días) / más adelante.
// Sin due date -> "none".
export function todoBucket(dueDate: string | null | undefined): TodoBucket {
  if (!dueDate) return "none";
  const today = todayKey();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  // Diferencia en días de calendario entre hoy y la fecha de ejecución.
  const diffDays = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  );
  return diffDays <= 7 ? "week" : "later";
}
