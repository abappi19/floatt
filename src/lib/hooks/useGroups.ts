import { useLiveQuery } from "dexie-react-hooks";
import { getAllGroups } from "@/lib/queries";
import type { Group } from "@/lib/types";

const EMPTY: Group[] = [];

export function useGroups(): Group[] {
  return useLiveQuery(() => getAllGroups(), [], EMPTY);
}
