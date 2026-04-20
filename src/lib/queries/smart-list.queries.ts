import { addDays, isBefore } from "date-fns";
import { db } from "@/lib/services/db.service";
import type { Task } from "@/lib/types";
import { startOfDay, todayIsoDate } from "@/lib/utils";

export interface PlannedBuckets {
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  later: Task[];
}

export function getMyDayTasks(): Promise<Task[]> {
  const today = todayIsoDate();
  return db.tasks
    .where("addedToMyDayAt")
    .equals(today)
    .filter((t) => t.isCompleted === 0)
    .sortBy("sortOrder");
}

export function getImportantTasks(): Promise<Task[]> {
  return db.tasks
    .where("isImportant")
    .equals(1)
    .filter((t) => t.isCompleted === 0)
    .sortBy("sortOrder");
}

export function getAllNonCompletedTasks(): Promise<Task[]> {
  return db.tasks.filter((t) => t.isCompleted === 0).sortBy("sortOrder");
}

export async function getPlannedTasks(): Promise<PlannedBuckets> {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const endOfWeek = addDays(todayStart, 7);

  const tasks = await db.tasks
    .filter((t) => t.isCompleted === 0 && !!t.dueDate)
    .sortBy("dueDate");

  const buckets: PlannedBuckets = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  for (const t of tasks) {
    if (!t.dueDate) continue;
    const d = startOfDay(t.dueDate);
    if (d.getTime() <= todayStart.getTime()) buckets.today.push(t);
    else if (d.getTime() === tomorrowStart.getTime()) buckets.tomorrow.push(t);
    else if (isBefore(d, endOfWeek)) buckets.thisWeek.push(t);
    else buckets.later.push(t);
  }

  return buckets;
}
