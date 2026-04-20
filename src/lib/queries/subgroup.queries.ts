import { db } from "@/lib/services/db.service";
import type { Subgroup } from "@/lib/types";

export function getAllSubgroups(): Promise<Subgroup[]> {
  return db.subgroups.orderBy("sortOrder").toArray();
}

export function getSubgroupsByGroup(
  groupId: string | null,
): Promise<Subgroup[]> {
  return db.subgroups
    .where("groupId")
    .equals(groupId as string)
    .sortBy("sortOrder");
}

export function getSubgroupById(id: string): Promise<Subgroup | undefined> {
  return db.subgroups.get(id);
}
