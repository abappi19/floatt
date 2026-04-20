import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import {
  PickerPopover,
  PickerPopoverContent,
  PickerPopoverTrigger,
} from "@/components/ui/picker-popover";
import { DatePickerCalendar } from "@/components/ui/date-picker-calendar";
import { formatDue } from "@/utils/date";
import { setTaskDueDate } from "@/services";
import { cn } from "@/utils/cn";
import type { Task } from "@/types";

interface DueDatePickerProps {
  task: Task;
}

export function DueDatePicker({ task }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = task.dueDate ? new Date(task.dueDate) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    void setTaskDueDate(task.id, format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    void setTaskDueDate(task.id, null);
  };

  const hasValue = !!task.dueDate;

  return (
    <div className="flex items-center gap-1">
      <PickerPopover open={open} onOpenChange={setOpen}>
        <PickerPopoverTrigger
          className={cn("flex-1", hasValue && "text-foreground")}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", !hasValue && "text-muted-foreground")}>
            {hasValue ? `Due ${formatDue(task.dueDate!)}` : "Add due date"}
          </span>
        </PickerPopoverTrigger>
        <PickerPopoverContent align="start" className="p-0">
          <DatePickerCalendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
          />
        </PickerPopoverContent>
      </PickerPopover>
      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear due date"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
