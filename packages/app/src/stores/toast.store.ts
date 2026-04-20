import { create } from "zustand";
import { newId } from "@/utils/id";

export interface Toast {
  id: string;
  title: string;
  body?: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_AUTO_DISMISS_MS = 8000;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = newId();
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    window.setTimeout(() => get().dismiss(id), DEFAULT_AUTO_DISMISS_MS);
    return id;
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(input: Omit<Toast, "id">): string {
  return useToastStore.getState().push(input);
}
