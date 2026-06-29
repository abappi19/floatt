import { useMemo } from "react";
import { SMART_LISTS } from "@/consts";
import type { TaskSort } from "@/stores/ui.store";
import type { ListSelection, Task } from "@/types";
import { flattenPlanned, sortTasks } from "@/utils/task-sort.util";
import { useAllTasks } from "./use-all-tasks";
import { useImportantTasks } from "./use-important-tasks";
import { useMyDay } from "./use-my-day";
import { usePlannedTasks } from "./use-planned-tasks";
import { useSubgroups } from "./use-subgroups";
import { useTasks } from "./use-tasks";

export function useListTitle(selection: ListSelection): string {
  const subgroups = useSubgroups();
  if (selection.kind === "smart") {
    return SMART_LISTS.find((s) => s.id === selection.id)?.label ?? "Tasks";
  }
  return subgroups.find((s) => s.id === selection.id)?.name ?? "List";
}

export interface SubgroupListBody {
  pending: Task[];
  completed: Task[];
  isEmpty: boolean;
}

export function useSubgroupListBody(id: string, sort: TaskSort): SubgroupListBody {
  const tasks = useTasks(id);
  const pending = useMemo(
    () => sortTasks(tasks.filter((t) => t.isCompleted === 0), sort),
    [tasks, sort],
  );
  const completed = useMemo(
    () => tasks.filter((t) => t.isCompleted === 1),
    [tasks],
  );
  return {
    pending,
    completed,
    isEmpty: pending.length === 0 && completed.length === 0,
  };
}

export interface SmartListBody {
  tasks: Task[];
  isEmpty: boolean;
}

export function useSmartListBody(
  smartId: "my-day" | "important" | "tasks",
  sort: TaskSort,
): SmartListBody {
  const myDay = useMyDay();
  const important = useImportantTasks();
  const all = useAllTasks();
  const source =
    smartId === "my-day" ? myDay : smartId === "important" ? important : all;
  const tasks = useMemo(() => sortTasks(source, sort), [source, sort]);
  return { tasks, isEmpty: tasks.length === 0 };
}

export interface PlannedListBody {
  sections: { title: string; tasks: Task[] }[] | null;
  tasks: Task[] | null;
  isEmpty: boolean;
}

export function usePlannedListBody(sort: TaskSort): PlannedListBody {
  const buckets = usePlannedTasks();
  const totalCount =
    buckets.today.length +
    buckets.tomorrow.length +
    buckets.thisWeek.length +
    buckets.later.length;

  return useMemo<PlannedListBody>(() => {
    if (sort === "manual") {
      return {
        sections: [
          { title: "Today", tasks: buckets.today },
          { title: "Tomorrow", tasks: buckets.tomorrow },
          { title: "This week", tasks: buckets.thisWeek },
          { title: "Later", tasks: buckets.later },
        ],
        tasks: null,
        isEmpty: totalCount === 0,
      };
    }
    return {
      sections: null,
      tasks: sortTasks(flattenPlanned(buckets), sort),
      isEmpty: totalCount === 0,
    };
  }, [buckets, sort, totalCount]);
}
