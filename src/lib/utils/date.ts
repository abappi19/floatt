import {
  format,
  formatDistanceToNowStrict,
  isToday as dfIsToday,
  isTomorrow,
  isYesterday,
  startOfDay as dfStartOfDay,
} from "date-fns";

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

export function isToday(d: Date | string): boolean {
  return dfIsToday(toDate(d));
}

export function startOfDay(d: Date | string): Date {
  return dfStartOfDay(toDate(d));
}

export function formatDue(d: Date | string): string {
  const date = toDate(d);
  if (dfIsToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function relativeDue(d: Date | string): string {
  return formatDistanceToNowStrict(toDate(d), { addSuffix: true });
}

export function todayIsoDate(): string {
  return format(dfStartOfDay(new Date()), "yyyy-MM-dd");
}
