import type { Subtask, Task } from "@/lib/types";
import { newId, nextOccurrence } from "@/lib/utils";
import { db } from "./db.service";
import { SORT_ORDER_STEP } from "@/lib/consts";

export async function spawnNextOccurrence(task: Task): Promise<Task | null> {
  if (!task.repeat || !task.dueDate) return null;
  const prev = new Date(task.dueDate);
  const next = nextOccurrence(task.repeat, prev);
  const nextIso = next.toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const deltaMs = next.getTime() - prev.getTime();
  const shiftedReminder = task.reminderAt
    ? new Date(new Date(task.reminderAt).getTime() + deltaMs).toISOString()
    : undefined;

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
    reminderAt: shiftedReminder,
    repeat: task.repeat,
    isImportant: task.isImportant,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction("rw", db.tasks, db.subtasks, async () => {
    await db.tasks.add(nextTask);
    const templates = await db.subtasks
      .where("[taskId+sortOrder]")
      .between([task.id, -Infinity], [task.id, Infinity])
      .toArray();
    if (templates.length > 0) {
      const clones: Subtask[] = templates.map((s) => ({
        id: newId(),
        title: s.title,
        isCompleted: false,
        notes: s.notes,
        taskId: nextTask.id,
        sortOrder: s.sortOrder,
        createdAt: now,
        updatedAt: now,
      }));
      await db.subtasks.bulkAdd(clones);
    }
  });

  return nextTask;
}
