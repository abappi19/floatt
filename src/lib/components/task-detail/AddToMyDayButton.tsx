import { Sun, X } from "lucide-react";
import { addToMyDay, removeFromMyDay } from "@/lib/services";
import { todayIsoDate } from "@/lib/utils";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/lib/types";

interface AddToMyDayButtonProps {
  task: Task;
}

export function AddToMyDayButton({ task }: AddToMyDayButtonProps) {
  const inMyDay = task.addedToMyDayAt === todayIsoDate();

  const handleToggle = () => {
    if (inMyDay) {
      void removeFromMyDay(task.id);
    } else {
      void addToMyDay(task.id);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    void removeFromMyDay(task.id);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full flex-1 items-center gap-3 rounded-md border border-transparent bg-transparent px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          inMyDay && "text-foreground",
        )}
      >
        <Sun className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate", !inMyDay && "text-muted-foreground")}>
          {inMyDay ? "Added to My Day" : "Add to My Day"}
        </span>
      </button>
      {inMyDay ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Remove from My Day"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
