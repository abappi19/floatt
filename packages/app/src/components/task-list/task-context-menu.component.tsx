import { useState } from "react";
import type { ReactElement } from "react";
import { addDays, format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  ListPlus,
  ListTodo,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import type { Task } from "@/types";
import { useSelectList, useSubgroups } from "@/hooks";
import {
  addToMyDay,
  createSubgroup,
  deleteTask,
  moveTaskToSubgroup,
  removeFromMyDay,
  setTaskCompleted,
  setTaskDueDate,
  toggleTaskImportant,
} from "@/services";
import {
  SidebarItemContextMenu,
  type SidebarMenuAction,
} from "@/components/sidebar/sidebar-item-menu.component";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.ui";
import { DatePickerCalendar } from "@/components/ui/date-picker-calendar.ui";

function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

interface TaskContextMenuProps {
  task: Task;
  children: ReactElement;
}

export function TaskContextMenu({ task, children }: TaskContextMenuProps) {
  const subgroups = useSubgroups();
  const selectList = useSelectList();
  const [dateOpen, setDateOpen] = useState(false);

  const isCompleted = task.isCompleted === 1;
  const isImportant = task.isImportant === 1;
  const inMyDay = !!task.addedToMyDayAt;

  const moveTargets = subgroups.filter((s) => s.id !== task.subgroupId);

  const createListFromTask = async () => {
    const sub = await createSubgroup({ name: task.title });
    await moveTaskToSubgroup(task.id, sub.id);
    selectList({ kind: "subgroup", id: sub.id });
  };

  const actions: SidebarMenuAction[] = [
    {
      kind: "item",
      label: inMyDay ? "Remove from My Day" : "Add to My Day",
      icon: Sun,
      onSelect: () =>
        void (inMyDay ? removeFromMyDay(task.id) : addToMyDay(task.id)),
    },
    {
      kind: "item",
      label: isImportant ? "Remove Importance" : "Mark as Important",
      icon: Star,
      onSelect: () => void toggleTaskImportant(task.id),
    },
    {
      kind: "item",
      label: isCompleted ? "Mark as Not Completed" : "Mark as Completed",
      icon: CircleCheck,
      onSelect: () => void setTaskCompleted(task.id, !isCompleted),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Due Today",
      icon: Calendar,
      onSelect: () => void setTaskDueDate(task.id, isoDate(new Date())),
    },
    {
      kind: "item",
      label: "Due Tomorrow",
      icon: CalendarClock,
      onSelect: () => void setTaskDueDate(task.id, isoDate(addDays(new Date(), 1))),
    },
    {
      kind: "item",
      label: "Pick a Date",
      icon: CalendarDays,
      onSelect: () => setDateOpen(true),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Create New List from This Task",
      icon: ListPlus,
      onSelect: () => void createListFromTask(),
    },
    {
      kind: "submenu",
      label: "Move Task to…",
      icon: ArrowRight,
      items: moveTargets.length
        ? moveTargets.map<SidebarMenuAction>((s) => ({
            kind: "item",
            label: s.name,
            icon: ListTodo,
            onSelect: () => void moveTaskToSubgroup(task.id, s.id),
          }))
        : [
            {
              kind: "item",
              label: "No other lists",
              disabled: true,
              onSelect: () => {},
            },
          ],
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Delete Task",
      icon: Trash2,
      variant: "destructive",
      onSelect: () => void deleteTask(task.id),
    },
  ];

  return (
    <>
      <SidebarItemContextMenu actions={actions}>
        {children}
      </SidebarItemContextMenu>
      <Dialog open={dateOpen} onOpenChange={setDateOpen}>
        <DialogContent className="w-auto p-4">
          <DialogHeader>
            <DialogTitle>Pick a date</DialogTitle>
          </DialogHeader>
          <DatePickerCalendar
            mode="single"
            selected={task.dueDate ? new Date(task.dueDate) : undefined}
            onSelect={(date) => {
              if (date) void setTaskDueDate(task.id, isoDate(date));
              setDateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
