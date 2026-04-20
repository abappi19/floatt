import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getAllTasks } from "@/lib/queries";
import {
  buildSearchIndex,
  searchTasks,
  type SearchableTask,
} from "@/lib/services";
import { useUiStore } from "@/lib/stores";
import type { Task } from "@/lib/types";

const EMPTY_TASKS: Task[] = [];

export function useSearch(): SearchableTask[] {
  const query = useUiStore((s) => s.searchQuery);
  const tasks = useLiveQuery(() => getAllTasks(), [], EMPTY_TASKS);

  useEffect(() => {
    buildSearchIndex(tasks);
  }, [tasks]);

  return useMemo(() => searchTasks(query), [query, tasks]);
}
