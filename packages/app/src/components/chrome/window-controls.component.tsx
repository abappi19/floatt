import { Minus, Square, X } from "lucide-react";
import { usePlatform } from "@/providers/platform.provider";

export function WindowControls() {
  const { window: win } = usePlatform();
  if (win.controls !== "custom") return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-8 items-center">
      <button
        type="button"
        aria-label="Minimize"
        onClick={() => void win.minimize()}
        className="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={() => void win.toggleMaximize()}
        className="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Square className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={() => void win.close()}
        className="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
