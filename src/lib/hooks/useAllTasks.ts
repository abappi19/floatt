import { useLiveQuery } from "dexie-react-hooks";
import { getAllNonCompletedTasks } from "@/lib/queries";
import type { Task } from "@/lib/types";

const EMPTY: Task[] = [];

export function useAllTasks(): Task[] {
  return useLiveQuery(() => getAllNonCompletedTasks(), [], EMPTY);
}
