import { useMemo } from "react";
import { SMART_LISTS } from "@/consts";
import type { SmartListId } from "@/types";
import { cn } from "@/utils/cn";
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
    <ul className="flex flex-col gap-0.5 px-2">
      {SMART_LISTS.map(({ id, label, icon: Icon }) => {
        const isActive = selected.kind === "smart" && selected.id === id;
        const count = counts[id];
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => selectList({ kind: "smart", id })}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {count > 0 ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
