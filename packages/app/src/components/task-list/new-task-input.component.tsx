import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn.util";
import { todayIsoDate } from "@/utils";
import type { ListSelection, SmartListId } from "@/types";
import {
  addToMyDay,
  createTask,
  setTaskDueDate,
  toggleTaskImportant,
} from "@/services";
import { useSubgroups } from "@/hooks";
import { useCommandStore } from "@/stores";

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

  useEffect(() => {
    setTitle("");
  }, [selection.kind, selection.kind === "smart" ? selection.id : selection.id]);

  const focusNonce = useCommandStore((s) => s.focusQuickAddNonce);
  useEffect(() => {
    if (focusNonce === 0) return;
    inputRef.current?.focus();
  }, [focusNonce]);

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
        "flex items-center gap-3 rounded-lg bg-muted px-3.5 py-3 shadow-xs transition-all",
        // "hover:border-ring/60",
        // isFocused && "border-ring ring-[3px] ring-ring/25",
        disabled && "opacity-60 hover:border-border",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
          isFocused
            ? "bg-primary text-primary-foreground"
            : "text-primary",
        )}
      >
        <Plus className="size-4" />
      </span>
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
        className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {title.trim() ? (
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Add
        </button>
      ) : null}
    </form>
  );
}
