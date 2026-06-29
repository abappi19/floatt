import { usePlannedListBody } from "@/hooks";
import type { TaskSort } from "@/stores/ui.store";
import { EmptyState } from "../empty-state.component";
import { TaskFlatList } from "./task-flat-list.component";
import { TaskSection } from "./task-section.component";

export function PlannedBody({ sort }: { sort: TaskSort }) {
  const body = usePlannedListBody(sort);
  if (body.isEmpty)
    return <EmptyState selection={{ kind: "smart", id: "planned" }} />;
  return (
    <div className="flex flex-col gap-3">
      {body.sections ? (
        <div className="flex flex-col gap-5">
          {body.sections.map((s) => (
            <TaskSection key={s.title} title={s.title} tasks={s.tasks} />
          ))}
        </div>
      ) : (
        <TaskFlatList tasks={body.tasks ?? []} />
      )}
    </div>
  );
}
