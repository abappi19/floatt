import { Fragment, useMemo } from "react";
import {
  Bell,
  Calendar,
  Check,
  ListChecks,
  Repeat,
  Star,
  StickyNote,
} from "lucide-react";
import { RoundCheckbox } from "@/components/ui/round-checkbox.ui";
import { cn } from "@/utils/cn.util";
import { formatDue, startOfDay } from "@/utils";
import type { Task } from "@/types";
import { useSubtasks, useSelectTask, useSelectedTaskId } from "@/hooks";
import { setTaskCompleted, toggleTaskImportant } from "@/services";
import { TaskContextMenu } from "./task-context-menu.component";

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
    <TaskContextMenu task={task}>
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
          "group flex w-full cursor-default items-center gap-2 rounded-md bg-card p-2 text-sm shadow-xs transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          "opacity-85",
          isActive && "border-primary/20 bg-accent shadow-sm",
        )}
      >
        <RoundCheckbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={isCompleted ? "Mark as not completed" : "Mark as completed"}
          className="mt-0.5 size-4"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={cn(
              "truncate text-xs",
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
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
                {[
                  total > 0 ? (
                    <span
                      key="subtasks"
                      className={cn(
                        "inline-flex items-center gap-0.5 tabular-nums",
                        !isCompleted && "text-violet-500",
                      )}
                    >
                      {done === total ? (
                        <Check className="size-2.5" />
                      ) : (
                        <ListChecks className="size-2.5" />
                      )}
                      {done} of {total}
                    </span>
                  ) : null,
                  dueDateLabel ? (
                    <span
                      key="due"
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        !isCompleted &&
                          (isOverdue ? "text-destructive" : "text-sky-500"),
                      )}
                    >
                      <Calendar className="size-2.5" />
                      {dueDateLabel}
                    </span>
                  ) : null,
                  reminderLabel ? (
                    <span
                      key="reminder"
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        !isCompleted && "text-amber-500",
                      )}
                    >
                      <Bell className="size-2.5" />
                      {reminderLabel}
                    </span>
                  ) : null,
                  task.repeat ? (
                    <span
                      key="repeat"
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        !isCompleted && "text-emerald-500",
                      )}
                    >
                      <Repeat className="size-2.5" />
                      {task.repeat.kind}
                    </span>
                  ) : null,
                  hasNotes ? (
                    <span
                      key="note"
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        !isCompleted && "text-orange-400",
                      )}
                    >
                      <StickyNote className="size-3" />
                      Note
                    </span>
                  ) : null,
                ]
                  .filter(Boolean)
                  .map((node, i) => (
                    <Fragment key={i}>
                      {i > 0 ? (
                        <span className="text-muted-foreground/40">·</span>
                      ) : null}
                      {node}
                    </Fragment>
                  ))}
              </div>
            )}
        </div>

        <button
          type="button"
          onClick={handleStar}
          aria-label={isImportant ? "Remove importance" : "Mark as important"}
          aria-pressed={isImportant}
          className={cn(
            "mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground/50 transition-colors hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            isImportant && "text-rose-500 hover:text-rose-500",
          )}
        >
          <Star
            className={cn("size-4", isImportant && "fill-current")}
          />
        </button>
      </div>
    </TaskContextMenu>
  );
}
