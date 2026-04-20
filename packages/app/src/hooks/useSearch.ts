import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getAllTasks } from "@/queries";
import {
  buildSearchIndex,
  searchTasks,
  type SearchableTask,
} from "@/services";
import { useUiStore } from "@/stores";
import type { Task } from "@/types";

const EMPTY_TASKS: Task[] = [];

export function useSearch(): SearchableTask[] {
  const query = useUiStore((s) => s.searchQuery);
  const tasks = useLiveQuery(() => getAllTasks(), [], EMPTY_TASKS);

  useEffect(() => {
    buildSearchIndex(tasks);
  }, [tasks]);

  return useMemo(() => searchTasks(query), [query, tasks]);
}
