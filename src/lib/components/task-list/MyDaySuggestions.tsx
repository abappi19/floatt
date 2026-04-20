import { useState } from "react";
import { ChevronDown, Lightbulb, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/lib/components/ui/button";
import { formatDue } from "@/lib/utils";
import type { MyDaySuggestion } from "@/lib/queries";
import { useMyDaySuggestions, useSubgroups } from "@/lib/hooks";
import { addToMyDay } from "@/lib/services";

const DISMISS_KEY = "floatt:my-day-tip-dismissed-on";

function isDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;
  const today = new Date().toISOString().slice(0, 10);
  return stored === today;
}

function reasonLabel(s: MyDaySuggestion): string {
  if (s.reason === "overdue") {
    return s.task.dueDate ? `Overdue — ${formatDue(s.task.dueDate)}` : "Overdue";
  }
  if (s.reason === "due-today") return "Due today";
  return "Yesterday in My Day";
}

export function MyDaySuggestions() {
  const suggestions = useMyDaySuggestions();
  const subgroups = useSubgroups();
  const [dismissed, setDismissed] = useState<boolean>(() => isDismissedToday());
  const [isOpen, setIsOpen] = useState(true);

  if (dismissed || suggestions.length === 0) return null;

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        DISMISS_KEY,
        new Date().toISOString().slice(0, 10),
      );
    }
    setDismissed(true);
  };

  const listNameFor = (subgroupId: string): string =>
    subgroups.find((s) => s.id === subgroupId)?.name ?? "List";

  return (
    <div className="rounded-md border bg-card shadow-xs">
      <div className="flex items-center gap-2 px-3 py-2">
        <Lightbulb className="size-4 text-primary" />
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
        >
          <span>Suggestions</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {suggestions.length}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-muted-foreground transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          aria-label="Dismiss suggestions"
        >
          <X />
        </Button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col border-t">
            {suggestions.map((s) => (
              <li
                key={s.task.id}
                className="flex items-start gap-3 border-b px-3 py-2 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate">{s.task.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {reasonLabel(s)} · {listNameFor(s.task.subgroupId)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void addToMyDay(s.task.id)}
                  aria-label="Add to My Day"
                >
                  <Plus />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
