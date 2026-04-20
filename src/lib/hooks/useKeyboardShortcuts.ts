import { useEffect } from "react";
import { useCommandStore, useUiStore } from "@/lib/stores";
import { setTaskCompleted } from "@/lib/services";
import { db } from "@/lib/services/db.service";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const mod = e.metaKey || e.ctrlKey;
      const typing = isTypingTarget(e.target);

      if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        useCommandStore.getState().openNewList();
        return;
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        useCommandStore.getState().focusQuickAdd();
        return;
      }

      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        useCommandStore.getState().focusSearch();
        return;
      }

      if (typing) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        const id = useUiStore.getState().selectedTaskId;
        if (!id) return;
        e.preventDefault();
        useCommandStore.getState().requestDelete(id);
        return;
      }

      if (e.key === " " || e.code === "Space") {
        const id = useUiStore.getState().selectedTaskId;
        if (!id) return;
        e.preventDefault();
        void db.tasks.get(id).then((t) => {
          if (!t) return;
          void setTaskCompleted(id, t.isCompleted === 0);
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
