import { useLiveQuery } from "dexie-react-hooks";
import { getImportantTasks } from "@/lib/queries";
import type { Task } from "@/lib/types";

const EMPTY: Task[] = [];

export function useImportantTasks(): Task[] {
  return useLiveQuery(() => getImportantTasks(), [], EMPTY);
}
