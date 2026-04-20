import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { todayIsoDate } from "@/lib/utils";
import type { ListSelection, SmartListId } from "@/lib/types";
import {
  addToMyDay,
  createTask,
  setTaskDueDate,
  toggleTaskImportant,
} from "@/lib/services";
import { useSubgroups } from "@/lib/hooks";

interface NewTaskInputProps {
  selection: ListSelection;
}

const PLACEHOLDER: Record<SmartListId, string> = {
  "my-day": "Add a task to My Day",
  important: "Add an important task",
  planned: "Add a task due today",
  tasks: "Add a task",
};

export function NewTaskInput({ selection }: NewTaskInputProps) {
  const [title, setTitle] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const subgroups = useSubgroups();
  const inputRef = useRef<HTMLInputElement>(null);

  const homeSubgroupId =
    selection.kind === "subgroup" ? selection.id : subgroups[0]?.id ?? null;

  const disabled = !homeSubgroupId;

  const placeholder =
    selection.kind === "smart"
      ? PLACEHOLDER[selection.id]
      : "Add a task";

  // Reset draft when switching lists
  useEffect(() => {
    setTitle("");
  }, [selection.kind, selection.kind === "smart" ? selection.id : selection.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !homeSubgroupId) return;

    const task = await createTask({
      title: trimmed,
      subgroupId: homeSubgroupId,
    });

    if (selection.kind === "smart") {
      if (selection.id === "my-day") {
        await addToMyDay(task.id);
      } else if (selection.id === "important") {
        await toggleTaskImportant(task.id);
      } else if (selection.id === "planned") {
        await setTaskDueDate(task.id, todayIsoDate());
      }
    }

    setTitle("");
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 shadow-xs transition-colors",
        isFocused && "border-ring ring-[2px] ring-ring/40",
        disabled && "opacity-60",
      )}
    >
      <Plus
        className={cn(
          "size-4 shrink-0 text-muted-foreground",
          isFocused && "text-primary",
        )}
      />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={
          disabled ? "Create a list first to add tasks" : placeholder
        }
        disabled={disabled}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {title.trim() ? (
        <button
          type="submit"
          className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add
        </button>
      ) : null}
    </form>
  );
}
