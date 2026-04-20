import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { SearchX } from "lucide-react";
import Fuse from "fuse.js";
import { db } from "@/services/db.service";
import {
  useSearchQuery,
  useSelectList,
  useSelectTask,
  useSubgroups,
} from "@/hooks";
import type { Subgroup, Subtask, Task } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskRow } from "@/components/task-list/TaskRow";

type Entity =
  | { kind: "task"; task: Task; listLabel: string }
  | { kind: "subtask"; subtask: Subtask; task: Task; listLabel: string };

function labelFor(
  subgroupId: string,
  subgroups: Subgroup[],
): string {
  return subgroups.find((s) => s.id === subgroupId)?.name ?? "List";
}

export function SearchResults() {
  const query = useSearchQuery();
  const subgroups = useSubgroups();
  const selectList = useSelectList();
  const selectTask = useSelectTask();

  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const subtasks = useLiveQuery(() => db.subtasks.toArray(), [], []);

  const taskFuse = useMemo(
    () =>
      new Fuse(tasks, {
        keys: [
          { name: "title", weight: 2 },
          { name: "notes", weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [tasks],
  );

  const subtaskFuse = useMemo(
    () =>
      new Fuse(subtasks, {
        keys: [
          { name: "title", weight: 2 },
          { name: "notes", weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [subtasks],
  );

  const { taskHits, subtaskHits } = useMemo(() => {
    if (!query.trim()) return { taskHits: [] as Entity[], subtaskHits: [] as Entity[] };
    const taskResults = taskFuse.search(query).map<Entity>((r) => ({
      kind: "task",
      task: r.item,
      listLabel: labelFor(r.item.subgroupId, subgroups),
    }));
    const subtaskResults = subtaskFuse
      .search(query)
      .map<Entity | null>((r) => {
        const parent = tasks.find((t) => t.id === r.item.taskId);
        if (!parent) return null;
        return {
          kind: "subtask",
          subtask: r.item,
          task: parent,
          listLabel: labelFor(parent.subgroupId, subgroups),
        };
      })
      .filter((e): e is Entity => e !== null);
    return { taskHits: taskResults, subtaskHits: subtaskResults };
  }, [query, taskFuse, subtaskFuse, tasks, subgroups]);

  const openTask = (task: Task) => {
    selectList({ kind: "subgroup", id: task.subgroupId });
    selectTask(task.id);
  };

  const empty = taskHits.length === 0 && subtaskHits.length === 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center gap-3 border-b px-4">
        <span className="font-semibold">Search</span>
        <span className="text-xs text-muted-foreground">
          {taskHits.length + subtaskHits.length} results
        </span>
      </header>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 px-3 py-3">
          {empty ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <SearchX className="size-8 opacity-60" />
              No matches for "{query}"
            </div>
          ) : null}

          {taskHits.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tasks
              </h3>
              <ul className="flex flex-col gap-1.5">
                {taskHits.map((h) => (
                  <li key={h.kind === "task" ? h.task.id : ""} onClick={() => h.kind === "task" && openTask(h.task)}>
                    {h.kind === "task" ? (
                      <div className="flex flex-col gap-1">
                        <TaskRow task={h.task} />
                        <span className="px-3 text-[11px] text-muted-foreground">
                          in {h.listLabel}
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {subtaskHits.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Steps
              </h3>
              <ul className="flex flex-col gap-1">
                {subtaskHits.map((h) =>
                  h.kind === "subtask" ? (
                    <li key={h.subtask.id}>
                      <button
                        type="button"
                        onClick={() => openTask(h.task)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-md border border-transparent bg-card px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent/60"
                      >
                        <span className="truncate">{h.subtask.title}</span>
                        <span className="text-[11px] text-muted-foreground">
                          step of "{h.task.title}" — {h.listLabel}
                        </span>
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
