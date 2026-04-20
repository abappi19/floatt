import { useLiveQuery } from "dexie-react-hooks";
import { getAllSubgroups, getSubgroupsByGroup } from "@/lib/queries";
import type { Subgroup } from "@/lib/types";

const EMPTY: Subgroup[] = [];

export function useSubgroups(): Subgroup[] {
  return useLiveQuery(() => getAllSubgroups(), [], EMPTY);
}

export function useSubgroupsByGroup(groupId: string | null): Subgroup[] {
  return useLiveQuery(
    () => getSubgroupsByGroup(groupId),
    [groupId],
    EMPTY,
  );
}
