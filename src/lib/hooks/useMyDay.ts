import { useLiveQuery } from "dexie-react-hooks";
import { getMyDayTasks } from "@/lib/queries";
import type { Task } from "@/lib/types";

const EMPTY: Task[] = [];

export function useMyDay(): Task[] {
  return useLiveQuery(() => getMyDayTasks(), [], EMPTY);
}
