import { useLiveQuery } from "dexie-react-hooks";
import { getAllGroups } from "@/queries";
import type { Group } from "@/types";

const EMPTY: Group[] = [];

export function useGroups(): Group[] {
  return useLiveQuery(() => getAllGroups(), [], EMPTY);
}
