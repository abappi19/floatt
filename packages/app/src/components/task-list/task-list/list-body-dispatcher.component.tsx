import type { TaskSort } from "@/stores/ui.store";
import type { ListSelection } from "@/types";
import { PlannedBody } from "./planned-body.component";
import { SmartBody } from "./smart-body.component";
import { SubgroupBody } from "./subgroup-body.component";

export function ListBodyDispatcher({
  selection,
  sort,
}: {
  selection: ListSelection;
  sort: TaskSort;
}) {
  if (selection.kind === "subgroup") {
    return <SubgroupBody id={selection.id} sort={sort} />;
  }
  if (selection.id === "planned") {
    return <PlannedBody sort={sort} />;
  }
  return <SmartBody smartId={selection.id} sort={sort} />;
}
