import type { Task } from "@/types";
import { TaskRow } from "../task-row.component";

export function TaskSection({ title, tasks }: { title: string; tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}
