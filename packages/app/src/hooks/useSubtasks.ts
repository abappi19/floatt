import { useLiveQuery } from "dexie-react-hooks";
import { getSubtasksByTask } from "@/queries";
import type { Subtask } from "@/types";

const EMPTY: Subtask[] = [];

export function useSubtasks(taskId: string | null | undefined): Subtask[] {
  return useLiveQuery(
    () => (taskId ? getSubtasksByTask(taskId) : Promise.resolve(EMPTY)),
    [taskId],
    EMPTY,
  );
}
