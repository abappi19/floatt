import { useLiveQuery } from "dexie-react-hooks";
import { getSubtasksByTask } from "@/lib/queries";
import type { Subtask } from "@/lib/types";

const EMPTY: Subtask[] = [];

export function useSubtasks(taskId: string | null | undefined): Subtask[] {
  return useLiveQuery(
    () => (taskId ? getSubtasksByTask(taskId) : Promise.resolve(EMPTY)),
    [taskId],
    EMPTY,
  );
}
