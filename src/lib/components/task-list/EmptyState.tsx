import type { LucideIcon } from "lucide-react";
import { Calendar, ListTodo, Star, Sun, Inbox } from "lucide-react";
import type { ListSelection, SmartListId } from "@/lib/types";

interface EmptyCopy {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SMART_EMPTY: Record<SmartListId, EmptyCopy> = {
  "my-day": {
    icon: Sun,
    title: "Focus on your day",
    description: "Add tasks you want to get done today.",
  },
  important: {
    icon: Star,
    title: "Make things happen",
    description: "Mark tasks with a star to see them here.",
  },
  planned: {
    icon: Calendar,
    title: "Get organized",
    description: "Tasks with a due date show up here.",
  },
  tasks: {
    icon: ListTodo,
    title: "All tasks",
    description: "Every task from every list, in one place.",
  },
};

const SUBGROUP_EMPTY: EmptyCopy = {
  icon: Inbox,
  title: "No tasks yet",
  description: "Add your first task to get started.",
};

interface EmptyStateProps {
  selection: ListSelection;
}

export function EmptyState({ selection }: EmptyStateProps) {
  const copy =
    selection.kind === "smart" ? SMART_EMPTY[selection.id] : SUBGROUP_EMPTY;
  const Icon = copy.icon;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="size-12 text-muted-foreground/60" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <span className="text-base font-medium">{copy.title}</span>
        <span className="text-sm text-muted-foreground">{copy.description}</span>
      </div>
    </div>
  );
}
