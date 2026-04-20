import { DEFAULT_GROUP_NAME, SORT_ORDER_STEP } from "@/consts";
import type { Group } from "@/types";
import { newId } from "@/utils";
import { db } from "./db.service";

async function nextSortOrder(): Promise<number> {
  const last = await db.groups.orderBy("sortOrder").last();
  return (last?.sortOrder ?? 0) + SORT_ORDER_STEP;
}

export async function createGroup(name = DEFAULT_GROUP_NAME): Promise<Group> {
  const group: Group = {
    id: newId(),
    name: name.trim() || DEFAULT_GROUP_NAME,
    sortOrder: await nextSortOrder(),
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  };
  await db.groups.add(group);
  return group;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.groups.update(id, { name: trimmed });
}

export async function toggleGroupCollapse(id: string): Promise<void> {
  const group = await db.groups.get(id);
  if (!group) return;
  await db.groups.update(id, { isCollapsed: !group.isCollapsed });
}

export async function deleteGroup(id: string): Promise<void> {
  await db.transaction("rw", db.groups, db.subgroups, async () => {
    await db.subgroups.where("groupId").equals(id).modify({ groupId: null });
    await db.groups.delete(id);
  });
}

export async function listGroups(): Promise<Group[]> {
  return db.groups.orderBy("sortOrder").toArray();
}
