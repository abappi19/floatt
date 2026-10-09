import { useLiveQuery } from "dexie-react-hooks";
import { getAllNonCompletedTasks } from "@/queries";
import type { Task } from "@/types";

const EMPTY: Task[] = [];

export function useOpenTasks(): Task[] {
  return useLiveQuery(() => getAllNonCompletedTasks(), [], EMPTY);
}
