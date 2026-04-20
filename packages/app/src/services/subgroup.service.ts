import { DEFAULT_SUBGROUP_NAME, SORT_ORDER_STEP } from "@/consts";
import type { Subgroup } from "@/types";
import { newId } from "@/utils";
import { db } from "./db.service";

interface CreateSubgroupInput {
  name?: string;
  groupId?: string | null;
}

async function nextSortOrder(): Promise<number> {
  const last = await db.subgroups.orderBy("sortOrder").last();
  return (last?.sortOrder ?? 0) + SORT_ORDER_STEP;
}

export async function createSubgroup(
  input: CreateSubgroupInput = {},
): Promise<Subgroup> {
  const subgroup: Subgroup = {
    id: newId(),
    name: (input.name ?? "").trim() || DEFAULT_SUBGROUP_NAME,
    groupId: input.groupId ?? null,
    sortOrder: await nextSortOrder(),
    createdAt: new Date().toISOString(),
  };
  await db.subgroups.add(subgroup);
  return subgroup;
}

export async function renameSubgroup(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.subgroups.update(id, { name: trimmed });
}

export async function moveSubgroup(
  id: string,
  groupId: string | null,
): Promise<void> {
  await db.subgroups.update(id, { groupId });
}

export async function deleteSubgroup(id: string): Promise<void> {
  await db.transaction(
    "rw",
    db.subgroups,
    db.tasks,
    db.subtasks,
    async () => {
      const tasks = await db.tasks.where("subgroupId").equals(id).toArray();
      const taskIds = tasks.map((t) => t.id);
      if (taskIds.length > 0) {
        await db.subtasks.where("taskId").anyOf(taskIds).delete();
      }
      await db.tasks.where("subgroupId").equals(id).delete();
      await db.subgroups.delete(id);
    },
  );
}

export async function listSubgroups(): Promise<Subgroup[]> {
  return db.subgroups.orderBy("sortOrder").toArray();
}

export async function listSubgroupsByGroup(
  groupId: string | null,
): Promise<Subgroup[]> {
  return db.subgroups
    .where("groupId")
    .equals(groupId as string)
    .sortBy("sortOrder");
}
