import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Clock,
  Flame,
  Folder,
  FolderInput,
  FolderMinus,
  GripVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area.ui";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog.ui";
import {
  SidebarItemMenu,
  type SidebarMenuAction,
} from "@/components/sidebar/sidebar-item-menu.component";
import { SMART_LISTS, themeStyle } from "@/consts";
import type { ListSelection, Task } from "@/types";
import {
  useAllTasks,
  useGroups,
  useImportantTasks,
  useMyDay,
  usePlannedTasks,
  useListTheme,
  useSelectList,
  useSelectedList,
  useSetTaskSort,
  useSubgroups,
  useTaskSort,
  useTasks,
  useTheme,
  useWindowInsets,
} from "@/hooks";
import { deleteSubgroup, moveSubgroup, renameSubgroup } from "@/services";
import type { TaskSort } from "@/stores/ui.store";
import type { PlannedBuckets } from "@/queries";
import { CompletedAccordion } from "./completed-accordion.component";
import { EmptyState } from "./empty-state.component";
import { MyDaySuggestions } from "./my-day-suggestions.component";
import { NewTaskInput } from "./new-task-input.component";
import { TaskRow } from "./task-row.component";
import { SortableTaskList } from "./sortable-task-list.component";
import { ThemePopover } from "./theme-popover.component";

function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  if (sort === "manual") return tasks;
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
  } else if (sort === "created") {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "myday") {
    copy.sort((a, b) => {
      if (!a.addedToMyDayAt && !b.addedToMyDayAt) return 0;
      if (!a.addedToMyDayAt) return 1;
      if (!b.addedToMyDayAt) return -1;
      return b.addedToMyDayAt.localeCompare(a.addedToMyDayAt);
    });
  }
  return copy;
}

function flattenPlanned(b: PlannedBuckets): Task[] {
  return [...b.today, ...b.tomorrow, ...b.thisWeek, ...b.later];
}

function TaskFlatList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {tasks.map((t) => (
        <li key={t.id}>
          <TaskRow task={t} />
        </li>
      ))}
    </ul>
  );
}

function TaskSection({ title, tasks }: { title: string; tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const SORT_OPTIONS: { value: TaskSort; label: string; icon: LucideIcon }[] = [
  { value: "manual", label: "Manual", icon: GripVertical },
  { value: "importance", label: "Important", icon: Star },
  { value: "alpha", label: "Alphabetically", icon: ArrowDownAZ },
  { value: "due", label: "Due date", icon: Calendar },
  { value: "created", label: "Creation date", icon: Clock },
  { value: "myday", label: "Added to My Day", icon: Flame },
];

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
  return {
    pending: <SortableTaskList tasks={pending} />,
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
    if (sort === "manual") {
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

function useListOptions(selection: ListSelection) {
  const sort = useTaskSort();
  const setSort = useSetTaskSort();
  const subgroups = useSubgroups();
  const groups = useGroups();
  const selectList = useSelectList();

  const subgroup =
    selection.kind === "subgroup"
      ? subgroups.find((s) => s.id === selection.id)
      : undefined;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const selectionKey = selection.id;
  useEffect(() => {
    setIsRenaming(false);
  }, [selection.kind, selectionKey]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    if (!subgroup) return;
    setDraftName(subgroup.name);
    setIsRenaming(true);
  };

  const commitRename = async () => {
    if (!subgroup) {
      setIsRenaming(false);
      return;
    }
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== subgroup.name) {
      await renameSubgroup(subgroup.id, trimmed);
    }
    setIsRenaming(false);
  };

  const sortAction: SidebarMenuAction = {
    kind: "submenu",
    label: "Sort",
    icon: ArrowUpDown,
    items: SORT_OPTIONS.map((o) => ({
      kind: "item",
      label: (sort === o.value ? "✓ " : "") + o.label,
      icon: o.icon,
      onSelect: () => setSort(o.value),
    })),
  };

  const actions: SidebarMenuAction[] = subgroup
    ? [
      { kind: "item", label: "Rename list", icon: Pencil, onSelect: startRename },
      {
        kind: "submenu",
        label: "Move to group",
        icon: FolderInput,
        items: [
          {
            kind: "item",
            label: "No group",
            icon: FolderMinus,
            disabled: subgroup.groupId === null,
            onSelect: () => moveSubgroup(subgroup.id, null),
          },
          ...(groups.length > 0 ? [{ kind: "separator" as const }] : []),
          ...groups.map<SidebarMenuAction>((g) => ({
            kind: "item",
            label: g.name,
            icon: Folder,
            disabled: g.id === subgroup.groupId,
            onSelect: () => moveSubgroup(subgroup.id, g.id),
          })),
        ],
      },
      sortAction,
      { kind: "separator" },
      {
        kind: "item",
        label: "Delete list",
        icon: Trash2,
        variant: "destructive",
        onSelect: () => setConfirmDelete(true),
      },
    ]
    : [sortAction];

  return {
    subgroup,
    actions,
    isRenaming,
    draftName,
    setDraftName,
    renameInputRef,
    commitRename,
    cancelRename: () => setIsRenaming(false),
    confirmDelete,
    setConfirmDelete,
    deleteList: () => {
      if (!subgroup) return;
      deleteSubgroup(subgroup.id);
      selectList({ kind: "smart", id: "my-day" });
    },
  };
}

export function TaskList() {
  const selection = useSelectedList();
  const sort = useTaskSort();
  const title = useListTitle(selection);
  const insets = useWindowInsets();
  const options = useListOptions(selection);
  const theme = useListTheme(selection);
  const mode = useTheme();

  return (
    <div
      className="flex h-full flex-col"
      style={themeStyle(theme, mode) as React.CSSProperties}
    >
      <header style={{ paddingTop: insets.top || undefined }} className="px-6">
        <div className="flex items-center gap-3">
          {
            options.isRenaming && options.subgroup
              ? (
                <input
                  ref={options.renameInputRef}
                  value={options.draftName}
                  onChange={(e) => options.setDraftName(e.target.value)}
                  onBlur={options.commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      options.commitRename();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      options.cancelRename();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-2xl font-bold tracking-tight outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
                />
              )
              : (
                <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
                  {title}
                </h1>
              )
          }
          <ThemePopover selection={selection} />
          <SidebarItemMenu
            actions={options.actions}
            label={`${title} options`}
            className="bg-muted text-muted-foreground opacity-100 hover:bg-muted/80 hover:text-foreground"
          />
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex min-h-full flex-col gap-3 px-3 py-3">
          {selection.kind === "smart" && selection.id === "my-day" ? (
            <MyDaySuggestions />
          ) : null}
          <ListBodyDispatcher selection={selection} sort={sort} />
        </div>
      </ScrollArea>

      <div className="p-3 opacity-95">
        <NewTaskInput selection={selection} />
      </div>

      <ConfirmDestructiveDialog
        open={options.confirmDelete}
        onOpenChange={options.setConfirmDelete}
        title={
          options.subgroup
            ? `Delete "${options.subgroup.name}"?`
            : "Delete list?"
        }
        description="This permanently deletes the list and all its tasks."
        onConfirm={options.deleteList}
      />
    </div>
  );
}
