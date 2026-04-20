import { SORT_ORDER_STEP } from "@/consts";
import type { Subtask } from "@/types";
import { newId } from "@/utils";
import { db } from "./db.service";

interface CreateSubtaskInput {
  title: string;
  taskId: string;
}

async function nextSortOrder(taskId: string): Promise<number> {
  const last = await db.subtasks
    .where("[taskId+sortOrder]")
    .between([taskId, -Infinity], [taskId, Infinity])
    .last();
  return (last?.sortOrder ?? 0) + SORT_ORDER_STEP;
}

export async function createSubtask(input: CreateSubtaskInput): Promise<Subtask> {
  const now = new Date().toISOString();
  const subtask: Subtask = {
    id: newId(),
    title: input.title.trim(),
    isCompleted: false,
    notes: "",
    taskId: input.taskId,
    sortOrder: await nextSortOrder(input.taskId),
    createdAt: now,
    updatedAt: now,
  };
  await db.subtasks.add(subtask);
  return subtask;
}

export async function renameSubtask(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;
  await db.subtasks.update(id, {
    title: trimmed,
    updatedAt: new Date().toISOString(),
  });
}

export async function setSubtaskNotes(
  id: string,
  notes: string,
): Promise<void> {
  await db.subtasks.update(id, {
    notes,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleSubtaskCompleted(id: string): Promise<void> {
  const subtask = await db.subtasks.get(id);
  if (!subtask) return;
  await db.subtasks.update(id, {
    isCompleted: !subtask.isCompleted,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSubtask(id: string): Promise<void> {
  await db.subtasks.delete(id);
}

export async function listSubtasksByTask(taskId: string): Promise<Subtask[]> {
  return db.subtasks
    .where("[taskId+sortOrder]")
    .between([taskId, -Infinity], [taskId, Infinity])
    .toArray();
}
