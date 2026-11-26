export type MissPolicy = "restart" | "continue";

export type DayRecord = {
  done: Record<string, boolean>;
  photo?: string;
  selfie?: string;
};

export function localDateString(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Could not read the local date");
  }
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayNumber(start: string, date: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const dateMs = Date.parse(`${date}T00:00:00Z`);
  return Math.round((dateMs - startMs) / 86400000) + 1;
}

export function weekdayIndex(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function prettyDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  if (end < start) return dates;
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function isDayComplete(taskIds: string[], day: DayRecord | undefined): boolean {
  if (!day) return false;
  return taskIds.every((id) => day.done[id] === true);
}

export function firstBrokenDate(
  start: string,
  today: string,
  taskIds: string[],
  days: Record<string, DayRecord | undefined>
): string | null {
  const yesterday = addDays(today, -1);
  if (yesterday < start) return null;
  for (const date of eachDate(start, yesterday)) {
    if (!isDayComplete(taskIds, days[date])) return date;
  }
  return null;
}

export function endDate(start: string, length: number): string {
  return addDays(start, length - 1);
}
