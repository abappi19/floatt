import { useMemo } from "react";
import { Bell, Calendar, ListChecks, Repeat, StickyNote, Star } from "lucide-react";
import { RoundCheckbox } from "@/lib/components/ui/round-checkbox";
import { cn } from "@/lib/utils/cn";
import { formatDue, startOfDay } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { useSubtasks, useSelectTask, useSelectedTaskId } from "@/lib/hooks";
import { setTaskCompleted, toggleTaskImportant } from "@/lib/services";

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const selectTask = useSelectTask();
  const selectedTaskId = useSelectedTaskId();
  const subtasks = useSubtasks(task.id);

  const { total, done } = useMemo(() => {
    return {
      total: subtasks.length,
      done: subtasks.filter((s) => s.isCompleted).length,
    };
  }, [subtasks]);

  const isCompleted = task.isCompleted === 1;
  const isImportant = task.isImportant === 1;
  const isActive = selectedTaskId === task.id;
  const hasNotes = task.notes.trim().length > 0;

  const dueDateLabel = task.dueDate ? formatDue(task.dueDate) : null;
  const isOverdue =
    !!task.dueDate &&
    !isCompleted &&
    startOfDay(task.dueDate).getTime() < startOfDay(new Date()).getTime();

  const reminderLabel = useMemo(() => {
    if (!task.reminderAt) return null;
    const d = new Date(task.reminderAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [task.reminderAt]);

  const handleToggle = () => {
    void setTaskCompleted(task.id, !isCompleted);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleTaskImportant(task.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          selectTask(task.id);
        } else if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          void setTaskCompleted(task.id, !isCompleted);
        }
      }}
      className={cn(
        "group flex w-full cursor-default items-start gap-3 rounded-md border border-transparent bg-card px-3 py-2.5 text-sm shadow-xs transition-colors hover:bg-accent/60 focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none",
        isActive && "border-ring bg-accent",
      )}
    >
      <RoundCheckbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
        aria-label={isCompleted ? "Mark as not completed" : "Mark as completed"}
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            "truncate",
            isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>

        {(dueDateLabel ||
          reminderLabel ||
          total > 0 ||
          hasNotes ||
          task.repeat) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {dueDateLabel ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  isOverdue && "text-destructive",
                )}
              >
                <Calendar className="size-3" />
                {dueDateLabel}
              </span>
            ) : null}
            {reminderLabel ? (
              <span className="inline-flex items-center gap-1">
                <Bell className="size-3" />
                {reminderLabel}
              </span>
            ) : null}
            {task.repeat ? (
              <span className="inline-flex items-center gap-1">
                <Repeat className="size-3" />
                {task.repeat.kind}
              </span>
            ) : null}
            {total > 0 ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <ListChecks className="size-3" />
                {done}/{total}
              </span>
            ) : null}
            {hasNotes ? (
              <span className="inline-flex items-center gap-1">
                <StickyNote className="size-3" />
                Note
              </span>
            ) : null}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleStar}
        aria-label={isImportant ? "Unstar task" : "Star task"}
        aria-pressed={isImportant}
        className={cn(
          "mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none",
          isImportant && "text-primary hover:text-primary",
        )}
      >
        <Star
          className={cn("size-4", isImportant && "fill-current")}
        />
      </button>
    </div>
  );
}
