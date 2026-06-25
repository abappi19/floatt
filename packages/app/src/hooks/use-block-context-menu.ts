import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest("input, textarea");
}

/**
 * Suppress the browser's native right-click menu everywhere, so the app reads
 * as a native desktop app. Editable fields keep their menu (copy/paste), and
 * our own Radix context menus still open — their trigger handles the event
 * before it bubbles to this listener.
 */
export function useBlockNativeContextMenu(): void {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handler);
    return () => window.removeEventListener("contextmenu", handler);
  }, []);
}
