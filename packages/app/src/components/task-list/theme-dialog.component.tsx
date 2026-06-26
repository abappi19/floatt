import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.ui";
import { cn } from "@/utils/cn.util";
import { THEMES } from "@/consts";
import { useListTheme, useSetListTheme, listThemeKey } from "@/hooks";
import type { ListSelection } from "@/types";

interface ThemeDialogProps {
  selection: ListSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeDialog({ selection, open, onOpenChange }: ThemeDialogProps) {
  const active = useListTheme(selection);
  const setListTheme = useSetListTheme();
  const key = listThemeKey(selection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>List theme</DialogTitle>
          <DialogDescription>
            Pick a background and accent for this list. Each theme has a light and
            dark variant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setListTheme(key, t.id)}
              aria-label={t.label}
              aria-pressed={active === t.id}
              title={t.label}
              style={{ background: t.swatch }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50",
                active === t.id && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              {active === t.id ? (
                <Check className="size-4 text-foreground/70" />
              ) : null}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
