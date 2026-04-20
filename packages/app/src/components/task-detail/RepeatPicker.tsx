import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Repeat as RepeatIcon, X } from "lucide-react";
import {
  PickerPopover,
  PickerPopoverContent,
  PickerPopoverTrigger,
} from "@/components/ui/picker-popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { repeatSchema } from "@/schemas";
import { setTaskRepeat } from "@/services";
import { cn } from "@/utils/cn";
import type { Repeat, RepeatKind, Task } from "@/types";

interface RepeatPickerProps {
  task: Task;
}

const KIND_OPTIONS: { value: RepeatKind; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const KIND_LABEL: Record<RepeatKind, string> = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function formatRepeat(r: Repeat): string {
  if (r.interval === 1) return KIND_LABEL[r.kind];
  return `Every ${r.interval} ${r.kind}`;
}

export function RepeatPicker({ task }: RepeatPickerProps) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Repeat>({
    resolver: zodResolver(repeatSchema),
    defaultValues: task.repeat ?? { kind: "daily", interval: 1 },
  });

  useEffect(() => {
    if (open) {
      reset(task.repeat ?? { kind: "daily", interval: 1 });
    }
  }, [open, task.repeat, reset]);

  const onSubmit = async (values: Repeat) => {
    await setTaskRepeat(task.id, values);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    void setTaskRepeat(task.id, null);
  };

  const hasValue = !!task.repeat;

  return (
    <div className="flex items-center gap-1">
      <PickerPopover open={open} onOpenChange={setOpen}>
        <PickerPopoverTrigger
          className={cn("flex-1", hasValue && "text-foreground")}
        >
          <RepeatIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", !hasValue && "text-muted-foreground")}>
            {hasValue ? formatRepeat(task.repeat!) : "Repeat"}
          </span>
        </PickerPopoverTrigger>
        <PickerPopoverContent align="start" className="w-64">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Frequency
              </label>
              <select
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                )}
                {...register("kind")}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Every
              </label>
              <Input
                type="number"
                min={1}
                {...register("interval", { valueAsNumber: true })}
              />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Save
            </Button>
          </form>
        </PickerPopoverContent>
      </PickerPopover>
      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear repeat"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
