import { SORT_ORDER_STEP } from "@/lib/consts";
import type { Bit, Repeat, Task } from "@/lib/types";
import { newId } from "@/lib/utils";
import { db } from "./db.service";
import { spawnNextOccurrence } from "./repeat.service";

interface CreateTaskInput {
  title: string;
  subgroupId: string;
}

async function nextSortOrder(subgroupId: string): Promise<number> {
  const last = await db.tasks
    .where("[subgroupId+sortOrder]")
    .between([subgroupId, -Infinity], [subgroupId, Infinity])
    .last();
  return (last?.sortOrder ?? 0) + SORT_ORDER_STEP;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: newId(),
    title: input.title.trim(),
    isCompleted: 0,
    notes: "",
    subgroupId: input.subgroupId,
    sortOrder: await nextSortOrder(input.subgroupId),
    isImportant: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(task);
  return task;
}

export async function renameTask(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;
  await db.tasks.update(id, {
    title: trimmed,
    updatedAt: new Date().toISOString(),
  });
}

export async function setTaskNotes(id: string, notes: string): Promise<void> {
  await db.tasks.update(id, { notes, updatedAt: new Date().toISOString() });
}

export async function toggleTaskImportant(id: string): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task) return;
  const next: Bit = task.isImportant === 1 ? 0 : 1;
  await db.tasks.update(id, {
    isImportant: next,
    updatedAt: new Date().toISOString(),
  });
}

export async function setTaskDueDate(
  id: string,
  dueDate: string | null,
): Promise<void> {
  await db.tasks.update(id, {
    dueDate: dueDate ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function setTaskReminder(
  id: string,
  reminderAt: string | null,
): Promise<void> {
  await db.tasks.update(id, {
    reminderAt: reminderAt ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function setTaskRepeat(
  id: string,
  repeat: Repeat | null,
): Promise<void> {
  await db.tasks.update(id, {
    repeat,
    updatedAt: new Date().toISOString(),
  });
}

export async function moveTaskToSubgroup(
  id: string,
  subgroupId: string,
): Promise<void> {
  const sortOrder = await nextSortOrder(subgroupId);
  await db.tasks.update(id, {
    subgroupId,
    sortOrder,
    updatedAt: new Date().toISOString(),
  });
}

export async function setTaskCompleted(
  id: string,
  completed: boolean,
): Promise<Task | null> {
  const task = await db.tasks.get(id);
  if (!task) return null;
  const now = new Date().toISOString();
  await db.tasks.update(id, {
    isCompleted: completed ? 1 : 0,
    completedAt: completed ? now : undefined,
    updatedAt: now,
  });
  const updated = (await db.tasks.get(id)) ?? null;
  if (completed && task.repeat && task.dueDate) {
    await spawnNextOccurrence(task);
  }
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await db.transaction("rw", db.tasks, db.subtasks, async () => {
    await db.subtasks.where("taskId").equals(id).delete();
    await db.tasks.delete(id);
  });
}
