import { db } from "@/services/db.service";
import type { Task } from "@/types";

export function getTasksBySubgroup(subgroupId: string): Promise<Task[]> {
  return db.tasks
    .where("[subgroupId+sortOrder]")
    .between([subgroupId, -Infinity], [subgroupId, Infinity])
    .toArray();
}

export function getTaskById(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

export function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export function getTasksWithReminders(): Promise<Task[]> {
  return db.tasks
    .where("reminderAt")
    .above("")
    .filter((t) => t.isCompleted === 0)
    .toArray();
}
