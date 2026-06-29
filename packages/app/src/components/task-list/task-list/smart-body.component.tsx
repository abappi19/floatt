import { useSmartListBody } from "@/hooks";
import type { TaskSort } from "@/stores/ui.store";
import { EmptyState } from "../empty-state.component";
import { TaskFlatList } from "./task-flat-list.component";

export function SmartBody({
  smartId,
  sort,
}: {
  smartId: "my-day" | "important" | "tasks";
  sort: TaskSort;
}) {
  const body = useSmartListBody(smartId, sort);
  if (body.isEmpty)
    return <EmptyState selection={{ kind: "smart", id: smartId }} />;
  return (
    <div className="flex flex-col gap-3">
      <TaskFlatList tasks={body.tasks} />
    </div>
  );
}
