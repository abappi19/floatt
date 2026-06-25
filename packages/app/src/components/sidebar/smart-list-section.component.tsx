import { useMemo } from "react";
import { SMART_LISTS } from "@/consts";
import type { SmartListId } from "@/types";
import { cn } from "@/utils/cn.util";
import {
  useAllTasks,
  useImportantTasks,
  useMyDay,
  usePlannedTasks,
  useSelectList,
  useSelectedList,
} from "@/hooks";

export function SmartListSection() {
  const selected = useSelectedList();
  const selectList = useSelectList();

  const myDay = useMyDay();
  const important = useImportantTasks();
  const planned = usePlannedTasks();
  const all = useAllTasks();

  const counts = useMemo<Record<SmartListId, number>>(
    () => ({
      "my-day": myDay.length,
      important: important.length,
      planned:
        planned.today.length +
        planned.tomorrow.length +
        planned.thisWeek.length +
        planned.later.length,
      tasks: all.length,
    }),
    [myDay, important, planned, all],
  );

  return (
    <ul className="flex flex-col">
      {SMART_LISTS.map(({ id, label, icon: Icon, iconColor }) => {
        const isActive = selected.kind === "smart" && selected.id === id;
        const count = counts[id];
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => selectList({ kind: "smart", id })}
              className={cn(
                "flex w-full items-center gap-2.5 pr-3 text-left text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <div className={cn("py-px pl-3 pr-1 flex h-7 w-8 shrink-0 items-center justify-center xrounded-tr-lg xrounded-br-lg")}>
                <Icon className={cn("size-3.5", iconColor)} />
              </div>
              <div className="grow min-w-0">
                <span className="block truncate min-w-0">{label}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {count > 0 ? 0 : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
