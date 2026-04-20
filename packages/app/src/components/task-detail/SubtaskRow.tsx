import { useEffect, useRef, useState } from "react";
import { ChevronDown, StickyNote, Trash2 } from "lucide-react";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { cn } from "@/utils/cn";
import {
  deleteSubtask,
  renameSubtask,
  toggleSubtaskCompleted,
} from "@/services";
import type { Subtask } from "@/types";
import { SubtaskNotesEditor } from "./SubtaskNotesEditor";

interface SubtaskRowProps {
  subtask: Subtask;
}

export function SubtaskRow({ subtask }: SubtaskRowProps) {
  const [title, setTitle] = useState(subtask.title);
  const [notesOpen, setNotesOpen] = useState(subtask.notes.trim().length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(subtask.title);
  }, [subtask.title]);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(subtask.title);
      return;
    }
    if (trimmed === subtask.title) return;
    void renameSubtask(subtask.id, trimmed);
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-accent/40">
      <div className="flex items-center gap-2">
        <RoundCheckbox
          checked={subtask.isCompleted}
          onCheckedChange={() => toggleSubtaskCompleted(subtask.id)}
          aria-label={subtask.isCompleted ? "Mark as not completed" : "Mark as completed"}
          className="size-4"
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
              setTitle(subtask.title);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "flex-1 min-w-0 rounded-sm bg-transparent px-1 py-0.5 text-sm outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50",
            subtask.isCompleted && "text-muted-foreground line-through",
          )}
        />
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          aria-label={notesOpen ? "Hide note" : "Add note"}
          aria-pressed={notesOpen}
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none",
            notesOpen && "text-foreground",
          )}
        >
          {notesOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <StickyNote className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => deleteSubtask(subtask.id)}
          aria-label="Delete subtask"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {notesOpen ? (
        <div className="pl-6">
          <SubtaskNotesEditor
            subtaskId={subtask.id}
            initialNotes={subtask.notes}
          />
        </div>
      ) : null}
    </div>
  );
}
