import { useLiveQuery } from "dexie-react-hooks";
import { getImportantTasks } from "@/queries";
import type { Task } from "@/types";

const EMPTY: Task[] = [];

export function useImportantTasks(): Task[] {
  return useLiveQuery(() => getImportantTasks(), [], EMPTY);
}
