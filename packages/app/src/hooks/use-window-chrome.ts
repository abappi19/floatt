import { usePlatform } from "@/providers/platform.provider";
import type { WindowInsets } from "@/platform/platform.type";

/** SafeArea-style: returns the px to keep clear of OS window chrome. Apply where you want. */
export function useWindowInsets(): WindowInsets {
  return usePlatform().window.insets;
}

/** Spread onto any element that should drag the window (and double-click to maximize). No-op on web. */
export function useDragRegion() {
  const { window: win } = usePlatform();
  if (win.controls === "none") return {};
  return {
    "data-tauri-drag-region": true,
    onDoubleClick: () => {
      void win.toggleMaximize();
    },
  };
}
