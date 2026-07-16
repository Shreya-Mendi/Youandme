import type { DayPlan, WeekDay } from "../types";

export const WEEK_DAYS: WeekDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/** Format a local date as an ISO "YYYY-MM-DD" key (no timezone shifting). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(weekKey: string): Date {
  const [y, m, d] = weekKey.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** The Monday (start) of the week containing the given date. */
export function mondayOf(d: Date = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = date.getDay(); // 0 = Sun … 6 = Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

/** Week key (Monday date string) for the week containing today. */
export function currentWeekKey(): string {
  return toDateKey(mondayOf());
}

/** Shift a week key by n weeks (n can be negative). */
export function addWeeks(weekKey: string, n: number): string {
  const date = parseKey(weekKey);
  date.setDate(date.getDate() + n * 7);
  return toDateKey(date);
}

/** Friendly label: "This week", "Next week", "Last week", else "Week of Jul 14". */
export function weekLabel(weekKey: string): string {
  const cur = currentWeekKey();
  if (weekKey === cur) return "This week";
  if (weekKey === addWeeks(cur, 1)) return "Next week";
  if (weekKey === addWeeks(cur, -1)) return "Last week";
  const date = parseKey(weekKey);
  return `Week of ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

/** Short date range, e.g. "Jul 14 – 20", for a supporting caption. */
export function weekRangeLabel(weekKey: string): string {
  const start = parseKey(weekKey);
  const end = parseKey(addWeeks(weekKey, 1));
  end.setDate(end.getDate() - 1);
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    day: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

/** A fresh, empty week plan (all seven days, no meals). */
export function emptyWeek(): DayPlan[] {
  return WEEK_DAYS.map((day) => ({ day }));
}
