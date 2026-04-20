import { useMemo } from "react";
import { ArrowDownAZ, ArrowUpDown, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SMART_LISTS } from "@/consts";
import type { ListSelection, Task } from "@/types";
import {
  useAllTasks,
  useImportantTasks,
  useMyDay,
  usePlannedTasks,
  useSelectedList,
  useSetTaskSort,
  useSubgroups,
  useTaskSort,
  useTasks,
} from "@/hooks";
import type { TaskSort } from "@/stores/ui.store";
import type { PlannedBuckets } from "@/queries";
import { CompletedAccordion } from "./CompletedAccordion";
import { EmptyState } from "./EmptyState";
import { MyDaySuggestions } from "./MyDaySuggestions";
import { NewTaskInput } from "./NewTaskInput";
import { TaskRow } from "./TaskRow";
import { SortableTaskList } from "./SortableTaskList";

function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  if (sort === "default") return tasks;
  const copy = [...tasks];
  if (sort === "alpha") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "importance") {
    copy.sort((a, b) => {
      if (a.isImportant !== b.isImportant) return b.isImportant - a.isImportant;
      return a.sortOrder - b.sortOrder;
    });
  } else if (sort === "due") {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }
  return copy;
}

function flattenPlanned(b: PlannedBuckets): Task[] {
  return [...b.today, ...b.tomorrow, ...b.thisWeek, ...b.later];
}

function TaskSection({ title, tasks }: { title: string; tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskFlatList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {tasks.map((t) => (
        <li key={t.id}>
          <TaskRow task={t} />
        </li>
      ))}
    </ul>
  );
}

const SORT_LABEL: Record<TaskSort, string> = {
  default: "Default",
  due: "Due date",
  importance: "Importance",
  alpha: "Alphabetical",
};

function SortMenu() {
  const sort = useTaskSort();
  const setSort = useSetTaskSort();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowUpDown />
          <span className="text-xs">{SORT_LABEL[sort]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSort("default")}>
          <ArrowUpDown />
          Default
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setSort("due")}>
          <Calendar />
          Due date
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setSort("importance")}>
          <Star />
          Importance
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setSort("alpha")}>
          <ArrowDownAZ />
          Alphabetical
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useListTitle(selection: ListSelection): string {
  const subgroups = useSubgroups();
  if (selection.kind === "smart") {
    return SMART_LISTS.find((s) => s.id === selection.id)?.label ?? "Tasks";
  }
  return subgroups.find((s) => s.id === selection.id)?.name ?? "List";
}

interface ListBody {
  pending: React.ReactNode;
  completed: Task[];
  isEmpty: boolean;
}

function useSubgroupListBody(id: string, sort: TaskSort): ListBody {
  const tasks = useTasks(id);
  const pending = useMemo(
    () => sortTasks(tasks.filter((t) => t.isCompleted === 0), sort),
    [tasks, sort],
  );
  const completed = useMemo(
    () => tasks.filter((t) => t.isCompleted === 1),
    [tasks],
  );
  const body =
    sort === "default" ? (
      <SortableTaskList tasks={pending} />
    ) : (
      <TaskFlatList tasks={pending} />
    );
  return {
    pending: body,
    completed,
    isEmpty: pending.length === 0 && completed.length === 0,
  };
}

function useSmartListBody(
  smartId: "my-day" | "important" | "tasks",
  sort: TaskSort,
): ListBody {
  const myDay = useMyDay();
  const important = useImportantTasks();
  const all = useAllTasks();
  const source =
    smartId === "my-day" ? myDay : smartId === "important" ? important : all;
  const sorted = useMemo(() => sortTasks(source, sort), [source, sort]);
  return {
    pending: <TaskFlatList tasks={sorted} />,
    completed: [],
    isEmpty: sorted.length === 0,
  };
}

function usePlannedListBody(sort: TaskSort): ListBody {
  const buckets = usePlannedTasks();
  const totalCount =
    buckets.today.length +
    buckets.tomorrow.length +
    buckets.thisWeek.length +
    buckets.later.length;

  const content = useMemo(() => {
    if (sort === "default") {
      return (
        <div className="flex flex-col gap-5">
          <TaskSection title="Today" tasks={buckets.today} />
          <TaskSection title="Tomorrow" tasks={buckets.tomorrow} />
          <TaskSection title="This week" tasks={buckets.thisWeek} />
          <TaskSection title="Later" tasks={buckets.later} />
        </div>
      );
    }
    return <TaskFlatList tasks={sortTasks(flattenPlanned(buckets), sort)} />;
  }, [buckets, sort]);

  return {
    pending: content,
    completed: [],
    isEmpty: totalCount === 0,
  };
}

function ListBodyDispatcher({
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

function SubgroupBody({ id, sort }: { id: string; sort: TaskSort }) {
  const body = useSubgroupListBody(id, sort);
  if (body.isEmpty) return <EmptyState selection={{ kind: "subgroup", id }} />;
  return (
    <div className="flex flex-col gap-3">
      {body.pending}
      <CompletedAccordion tasks={body.completed} />
    </div>
  );
}

function SmartBody({
  smartId,
  sort,
}: {
  smartId: "my-day" | "important" | "tasks";
  sort: TaskSort;
}) {
  const body = useSmartListBody(smartId, sort);
  if (body.isEmpty)
    return <EmptyState selection={{ kind: "smart", id: smartId }} />;
  return <div className="flex flex-col gap-3">{body.pending}</div>;
}

function PlannedBody({ sort }: { sort: TaskSort }) {
  const body = usePlannedListBody(sort);
  if (body.isEmpty)
    return <EmptyState selection={{ kind: "smart", id: "planned" }} />;
  return <div className="flex flex-col gap-3">{body.pending}</div>;
}

function HeaderCount({ selection }: { selection: ListSelection }) {
  const myDay = useMyDay();
  const important = useImportantTasks();
  const planned = usePlannedTasks();
  const all = useAllTasks();
  const subTasks = useTasks(
    selection.kind === "subgroup" ? selection.id : null,
  );

  let count = 0;
  if (selection.kind === "subgroup") {
    count = subTasks.filter((t) => t.isCompleted === 0).length;
  } else if (selection.id === "my-day") count = myDay.length;
  else if (selection.id === "important") count = important.length;
  else if (selection.id === "planned")
    count =
      planned.today.length +
      planned.tomorrow.length +
      planned.thisWeek.length +
      planned.later.length;
  else count = all.length;

  if (count === 0) return null;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
  );
}

export function TaskList() {
  const selection = useSelectedList();
  const sort = useTaskSort();
  const title = useListTitle(selection);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center gap-3 border-b px-4">
        <span className="font-semibold">{title}</span>
        <HeaderCount selection={selection} />
        <div className="ml-auto">
          <SortMenu />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="flex min-h-full flex-col gap-3 px-3 py-3">
          {selection.kind === "smart" && selection.id === "my-day" ? (
            <MyDaySuggestions />
          ) : null}
          <ListBodyDispatcher selection={selection} sort={sort} />
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <NewTaskInput selection={selection} />
      </div>
    </div>
  );
}
