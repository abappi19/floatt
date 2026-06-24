import { usePlatform } from "@/providers/PlatformProvider";

/** Transparent, full-width drag strip pinned to the top. Zero layout cost. */
export function DragRegion() {
  const { window: win } = usePlatform();
  if (win.controls === "none" || win.insets.top === 0) return null;

  return (
    <div
      data-tauri-drag-region
      onDoubleClick={() => void win.toggleMaximize()}
      aria-hidden
      className="fixed inset-x-0 top-0 z-40"
      style={{ height: win.insets.top }}
    />
  );
}
