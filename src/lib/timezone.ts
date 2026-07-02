// Zona horaria de la app (servidor). Default: Monterrey.
// En cliente hace falta NEXT_PUBLIC_APP_TIMEZONE (mismo valor).
const DEFAULT_TZ = "America/Monterrey";
const LOCALE = "es-MX";

export function appTimezone(): string {
  // ponytail: no usar process.env.TZ — en Linux/Vercel suele ser ":UTC" (POSIX), inválido para Intl.
  return (
    process.env.NEXT_PUBLIC_APP_TIMEZONE ||
    process.env.APP_TIMEZONE ||
    DEFAULT_TZ
  );
}

function tzParts(date: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    ...opts,
    timeZone: appTimezone(),
  }).formatToParts(date);
}

function tzPart(
  date: Date,
  type: Intl.DateTimeFormatPartTypes,
  opts: Intl.DateTimeFormatOptions,
): string {
  return tzParts(date, opts).find((p) => p.type === type)?.value ?? "";
}

/** YYYY-MM-DD en la zona horaria de la app. */
export function todayKey(now = new Date()): string {
  const y = tzPart(now, "year", { year: "numeric" });
  const m = tzPart(now, "month", { month: "2-digit" });
  const d = tzPart(now, "day", { day: "2-digit" });
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD del instante ISO en la zona horaria de la app. */
export function dayKeyFromIso(iso: string): string {
  return todayKey(new Date(iso));
}

/** Inicio/fin del día calendario en la zona horaria de la app. */
export function dayBounds(dateKey: string): { start: Date; end: Date } {
  return {
    start: new Date(localInputToIso(`${dateKey}T00:00`)),
    end: new Date(localInputToIso(`${dateKey}T23:59:59.999`)),
  };
}

export function shiftDayKey(dateKey: string, delta: number): string {
  const noon = new Date(localInputToIso(`${dateKey}T12:00`));
  return dayKeyFromIso(new Date(noon.getTime() + delta * 86_400_000).toISOString());
}

/** ISO → valor para `<input type="datetime-local">` en la TZ de la app. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const y = tzPart(d, "year", { year: "numeric" });
  const mo = tzPart(d, "month", { month: "2-digit" });
  const day = tzPart(d, "day", { day: "2-digit" });
  const h = tzPart(d, "hour", { hour: "2-digit", hourCycle: "h23" });
  const mi = tzPart(d, "minute", { minute: "2-digit" });
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

/** `<input type="datetime-local">` en TZ de la app → ISO UTC. */
export function localInputToIso(local: string): string {
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const secParts = timePart.split(":")[2]?.split(".") ?? [];
  const s = Number(secParts[0] ?? 0);
  const ms = Number(secParts[1] ?? 0);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, s, ms);
  const tz = appTimezone();
  let t = utcGuess;
  for (let i = 0; i < 2; i++) {
    t = utcGuess - tzOffsetMs(new Date(t), tz);
  }
  return new Date(t).toISOString();
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

export function nowLocalInput(): string {
  return isoToLocalInput(new Date().toISOString());
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    timeZone: appTimezone(),
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "jue 2 jul" para una clave YYYY-MM-DD. */
export function formatDayKeyShort(dateKey: string): string {
  const anchor = new Date(localInputToIso(`${dateKey}T12:00`));
  const wd = anchor.toLocaleDateString(LOCALE, {
    weekday: "short",
    timeZone: appTimezone(),
  });
  const mo = anchor.toLocaleDateString(LOCALE, {
    month: "short",
    timeZone: appTimezone(),
  });
  const dayNum = tzPart(anchor, "day", { day: "numeric" });
  return `${wd} ${dayNum} ${mo}`.replace(/\.$/, "");
}

/** "2 jul" desde un ISO. */
export function formatShortDateFromIso(iso: string): string {
  return formatDayKeyShort(dayKeyFromIso(iso));
}
