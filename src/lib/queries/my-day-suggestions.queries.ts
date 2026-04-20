import { format, subDays } from "date-fns";
import { db } from "@/lib/services/db.service";
import type { Task } from "@/lib/types";
import { todayIsoDate } from "@/lib/utils";

export interface MyDaySuggestion {
  task: Task;
  reason: "overdue" | "due-today" | "yesterday-my-day";
}

const MAX_SUGGESTIONS = 6;

export async function getMyDaySuggestions(): Promise<MyDaySuggestion[]> {
  const today = todayIsoDate();
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const candidates = await db.tasks
    .filter((t) => t.isCompleted === 0 && t.addedToMyDayAt !== today)
    .toArray();

  const byId = new Map<string, MyDaySuggestion>();

  for (const task of candidates) {
    let reason: MyDaySuggestion["reason"] | null = null;
    if (task.dueDate && task.dueDate < today) reason = "overdue";
    else if (task.dueDate === today) reason = "due-today";
    else if (task.addedToMyDayAt === yesterday) reason = "yesterday-my-day";
    if (!reason) continue;
    byId.set(task.id, { task, reason });
  }

  const priority: Record<MyDaySuggestion["reason"], number> = {
    overdue: 0,
    "due-today": 1,
    "yesterday-my-day": 2,
  };

  return [...byId.values()]
    .sort((a, b) => {
      const p = priority[a.reason] - priority[b.reason];
      if (p !== 0) return p;
      return a.task.sortOrder - b.task.sortOrder;
    })
    .slice(0, MAX_SUGGESTIONS);
}
