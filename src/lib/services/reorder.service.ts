import { SORT_ORDER_STEP } from "@/lib/consts";
import { db } from "./db.service";

function rebalance(ids: string[]): Array<{ id: string; sortOrder: number }> {
  return ids.map((id, index) => ({
    id,
    sortOrder: (index + 1) * SORT_ORDER_STEP,
  }));
}

export async function reorderGroups(orderedIds: string[]): Promise<void> {
  const updates = rebalance(orderedIds);
  await db.transaction("rw", db.groups, async () => {
    for (const { id, sortOrder } of updates) {
      await db.groups.update(id, { sortOrder });
    }
  });
}

export async function reorderSubgroups(orderedIds: string[]): Promise<void> {
  const updates = rebalance(orderedIds);
  await db.transaction("rw", db.subgroups, async () => {
    for (const { id, sortOrder } of updates) {
      await db.subgroups.update(id, { sortOrder });
    }
  });
}

export async function reorderTasks(orderedIds: string[]): Promise<void> {
  const updates = rebalance(orderedIds);
  await db.transaction("rw", db.tasks, async () => {
    for (const { id, sortOrder } of updates) {
      await db.tasks.update(id, { sortOrder });
    }
  });
}

export async function reorderSubtasks(orderedIds: string[]): Promise<void> {
  const updates = rebalance(orderedIds);
  await db.transaction("rw", db.subtasks, async () => {
    for (const { id, sortOrder } of updates) {
      await db.subtasks.update(id, { sortOrder });
    }
  });
}
