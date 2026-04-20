import { db } from "@/lib/services/db.service";
import type { Group } from "@/lib/types";

export function getAllGroups(): Promise<Group[]> {
  return db.groups.orderBy("sortOrder").toArray();
}

export function getGroupById(id: string): Promise<Group | undefined> {
  return db.groups.get(id);
}
