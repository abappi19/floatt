import type { Task } from "@/types";
import { TaskRow } from "../task-row.component";

export function TaskFlatList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {tasks.map((t) => (
        <li key={t.id}>
          <TaskRow task={t} />
        </li>
      ))}
    </ul>
  );
}
