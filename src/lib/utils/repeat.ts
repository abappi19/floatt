import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  getDay,
} from "date-fns";
import type { Repeat } from "@/lib/types";

export function nextOccurrence(
  repeat: Repeat,
  prev: Date,
  anchor: Date = prev,
): Date {
  const interval = Math.max(1, repeat.interval);
  switch (repeat.kind) {
    case "daily":
      return addDays(prev, interval);
    case "weekdays":
      return nextWeekday(prev);
    case "weekly":
      return addWeeks(prev, interval);
    case "monthly":
      return nextMonthly(prev, anchor, interval);
    case "yearly":
      return nextYearly(prev, anchor, interval);
  }
}

function nextWeekday(prev: Date): Date {
  const next = addDays(prev, 1);
  const day = getDay(next);
  if (day === 6) return addDays(next, 2);
  if (day === 0) return addDays(next, 1);
  return next;
}

function nextMonthly(prev: Date, anchor: Date, interval: number): Date {
  const elapsed = differenceInCalendarMonths(prev, anchor);
  return addMonths(anchor, elapsed + interval);
}

function nextYearly(prev: Date, anchor: Date, interval: number): Date {
  const elapsed = differenceInCalendarYears(prev, anchor);
  return addYears(anchor, elapsed + interval);
}
