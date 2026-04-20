import { useState } from "react";
import { format } from "date-fns";
import { Bell, X } from "lucide-react";
import {
  PickerPopover,
  PickerPopoverContent,
  PickerPopoverTrigger,
} from "@/lib/components/ui/picker-popover";
import { DatePickerCalendar } from "@/lib/components/ui/date-picker-calendar";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { setTaskReminder } from "@/lib/services";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/lib/types";

interface ReminderPickerProps {
  task: Task;
}

const DEFAULT_TIME = "09:00";

function combine(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d.toISOString();
}

function formatReminder(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReminderPicker({ task }: ReminderPickerProps) {
  const [open, setOpen] = useState(false);
  const initial = task.reminderAt ? new Date(task.reminderAt) : null;
  const [draftDate, setDraftDate] = useState<Date | undefined>(
    initial ?? undefined,
  );
  const [draftTime, setDraftTime] = useState<string>(
    initial ? format(initial, "HH:mm") : DEFAULT_TIME,
  );

  const handleSave = () => {
    if (!draftDate) return;
    void setTaskReminder(task.id, combine(draftDate, draftTime));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    void setTaskReminder(task.id, null);
    setDraftDate(undefined);
    setDraftTime(DEFAULT_TIME);
  };

  const hasValue = !!task.reminderAt;

  return (
    <div className="flex items-center gap-1">
      <PickerPopover open={open} onOpenChange={setOpen}>
        <PickerPopoverTrigger
          className={cn("flex-1", hasValue && "text-foreground")}
        >
          <Bell className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", !hasValue && "text-muted-foreground")}>
            {hasValue ? `Remind ${formatReminder(task.reminderAt!)}` : "Remind me"}
          </span>
        </PickerPopoverTrigger>
        <PickerPopoverContent align="start" className="p-0">
          <DatePickerCalendar
            mode="single"
            selected={draftDate}
            onSelect={setDraftDate}
          />
          <div className="flex items-center gap-2 border-t p-2">
            <Input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              className="h-8"
            />
            <Button size="sm" onClick={handleSave} disabled={!draftDate}>
              Save
            </Button>
          </div>
        </PickerPopoverContent>
      </PickerPopover>
      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear reminder"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
