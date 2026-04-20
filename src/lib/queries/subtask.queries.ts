import { db } from "@/lib/services/db.service";
import type { Subtask } from "@/lib/types";

export function getSubtasksByTask(taskId: string): Promise<Subtask[]> {
  return db.subtasks
    .where("[taskId+sortOrder]")
    .between([taskId, -Infinity], [taskId, Infinity])
    .toArray();
}
