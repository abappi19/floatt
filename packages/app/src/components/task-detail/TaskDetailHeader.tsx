import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { cn } from "@/utils/cn";
import {
  renameTask,
  setTaskCompleted,
  toggleTaskImportant,
} from "@/services";
import type { Task } from "@/types";

interface TaskDetailHeaderProps {
  task: Task;
}

export function TaskDetailHeader({ task }: TaskDetailHeaderProps) {
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task.title);
  }, [task.id, task.title]);

  const isCompleted = task.isCompleted === 1;
  const isImportant = task.isImportant === 1;

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (trimmed === task.title) return;
    void renameTask(task.id, trimmed);
  };

  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3 shadow-xs">
      <RoundCheckbox
        checked={isCompleted}
        onCheckedChange={() => setTaskCompleted(task.id, !isCompleted)}
        aria-label={isCompleted ? "Mark as not completed" : "Mark as completed"}
        className="mt-1"
      />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setTitle(task.title);
            inputRef.current?.blur();
          }
        }}
        className={cn(
          "flex-1 min-w-0 rounded-sm bg-transparent px-1 py-0.5 text-base font-medium outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50",
          isCompleted && "text-muted-foreground line-through",
        )}
      />
      <button
        type="button"
        onClick={() => toggleTaskImportant(task.id)}
        aria-label={isImportant ? "Unstar task" : "Star task"}
        aria-pressed={isImportant}
        className={cn(
          "mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none",
          isImportant && "text-primary hover:text-primary",
        )}
      >
        <Star className={cn("size-5", isImportant && "fill-current")} />
      </button>
    </div>
  );
}
