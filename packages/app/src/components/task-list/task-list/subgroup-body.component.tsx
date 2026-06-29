import { useSubgroupListBody } from "@/hooks";
import type { TaskSort } from "@/stores/ui.store";
import { CompletedAccordion } from "../completed-accordion.component";
import { EmptyState } from "../empty-state.component";
import { SortableTaskList } from "../sortable-task-list.component";

export function SubgroupBody({ id, sort }: { id: string; sort: TaskSort }) {
  const body = useSubgroupListBody(id, sort);
  if (body.isEmpty) return <EmptyState selection={{ kind: "subgroup", id }} />;
  return (
    <div className="flex flex-col gap-3">
      <SortableTaskList tasks={body.pending} />
      <CompletedAccordion tasks={body.completed} />
    </div>
  );
}
