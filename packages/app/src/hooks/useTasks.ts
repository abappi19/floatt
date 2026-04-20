import { useLiveQuery } from "dexie-react-hooks";
import { getTaskById, getTasksBySubgroup } from "@/queries";
import type { Task } from "@/types";

const EMPTY: Task[] = [];

export function useTasks(subgroupId: string | null | undefined): Task[] {
  return useLiveQuery(
    () => (subgroupId ? getTasksBySubgroup(subgroupId) : Promise.resolve(EMPTY)),
    [subgroupId],
    EMPTY,
  );
}

export function useTask(id: string | null | undefined): Task | undefined {
  return useLiveQuery(
    () => (id ? getTaskById(id) : Promise.resolve(undefined)),
    [id],
    undefined,
  );
}
