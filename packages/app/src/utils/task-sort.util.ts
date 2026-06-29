import type { PlannedBuckets } from "@/queries";
import type { TaskSort } from "@/stores/ui.store";
import type { Task } from "@/types";

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  if (sort === "manual") return tasks;
  const copy = [...tasks];
  if (sort === "alpha") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "importance") {
    copy.sort((a, b) => {
      if (a.isImportant !== b.isImportant) return b.isImportant - a.isImportant;
      return a.sortOrder - b.sortOrder;
    });
  } else if (sort === "due") {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else if (sort === "created") {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "myday") {
    copy.sort((a, b) => {
      if (!a.addedToMyDayAt && !b.addedToMyDayAt) return 0;
      if (!a.addedToMyDayAt) return 1;
      if (!b.addedToMyDayAt) return -1;
      return b.addedToMyDayAt.localeCompare(a.addedToMyDayAt);
    });
  }
  return copy;
}

export function flattenPlanned(b: PlannedBuckets): Task[] {
  return [...b.today, ...b.tomorrow, ...b.thisWeek, ...b.later];
}
