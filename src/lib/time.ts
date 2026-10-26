const pad = (n: number) => String(n).padStart(2, "0");

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && startB < endA;
}

function tzParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function zonedWallTimeToUtc(
  dateIso: string,
  timeHHmm: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hour, minute] = timeHHmm.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asUtc = new Date(utcGuess);
  const parts = tzParts(asUtc, timeZone);
  const asTz = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const offset = asTz - utcGuess;
  return new Date(utcGuess - offset);
}

export function formatInTimeZone(date: Date, timeZone: string, withDate = true) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: withDate ? "medium" : undefined,
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

export function weekdayInTimeZone(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function ymdInTimeZone(date: Date, timeZone: string) {
  const parts = tzParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function hmInTimeZone(date: Date, timeZone: string) {
  const parts = tzParts(date, timeZone);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function parseHm(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
