import { useState } from "react";
import type { CSSProperties } from "react";
import { Check, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.ui";
import { Button } from "@/components/ui/button.ui";
import { cn } from "@/utils/cn.util";
import { THEMES, themeSwatchStyle } from "@/consts";
import { useListTheme, useSetListTheme, listThemeKey, useTheme } from "@/hooks";
import type { ListSelection } from "@/types";

interface ThemePopoverProps {
  selection: ListSelection;
}

export function ThemePopover({ selection }: ThemePopoverProps) {
  const active = useListTheme(selection);
  const setListTheme = useSetListTheme();
  const key = listThemeKey(selection);
  const mode = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Change theme"
          className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground data-[state=open]:bg-muted/80"
        >
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setListTheme(key, t.id)}
                    aria-label={t.label}
                    aria-pressed={active === t.id}
                    style={themeSwatchStyle(t.id, mode) as CSSProperties}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50",
                      active === t.id &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                    )}
                  >
                    {active === t.id ? (
                      <Check
                        className={cn(
                          "size-3",
                          mode === "dark" ? "text-white" : "text-black/70",
                        )}
                      />
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
