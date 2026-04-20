import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface CompletedAccordionProps {
  tasks: Task[];
}

export function CompletedAccordion({ tasks }: CompletedAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aT = a.completedAt ?? "";
      const bT = b.completedAt ?? "";
      return bT.localeCompare(aT);
    });
  }, [tasks]);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            !isOpen && "-rotate-90",
          )}
        />
        <span>Completed</span>
        <span className="tabular-nums">{tasks.length}</span>
      </button>

      {isOpen ? (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
