import type { Task } from "@/lib/types";
import { newId, nextOccurrence } from "@/lib/utils";
import { db } from "./db.service";
import { SORT_ORDER_STEP } from "@/lib/consts";

export async function spawnNextOccurrence(task: Task): Promise<Task | null> {
  if (!task.repeat || !task.dueDate) return null;
  const prev = new Date(task.dueDate);
  const next = nextOccurrence(task.repeat, prev);
  const nextIso = next.toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const last = await db.tasks
    .where("[subgroupId+sortOrder]")
    .between([task.subgroupId, -Infinity], [task.subgroupId, Infinity])
    .last();
  const nextTask: Task = {
    id: newId(),
    title: task.title,
    isCompleted: 0,
    notes: task.notes,
    subgroupId: task.subgroupId,
    sortOrder: (last?.sortOrder ?? 0) + SORT_ORDER_STEP,
    dueDate: nextIso,
    reminderAt: task.reminderAt,
    repeat: task.repeat,
    isImportant: task.isImportant,
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(nextTask);
  return nextTask;
}
