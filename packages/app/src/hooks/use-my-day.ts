import { useLiveQuery } from "dexie-react-hooks";
import { getMyDayTasks } from "@/queries";
import type { Task } from "@/types";

const EMPTY: Task[] = [];

export function useMyDay(): Task[] {
  return useLiveQuery(() => getMyDayTasks(), [], EMPTY);
}
