import { create } from "zustand";

interface CommandStore {
  focusSearchNonce: number;
  focusQuickAddNonce: number;
  openNewListNonce: number;
  deleteRequestId: string | null;

  focusSearch: () => void;
  focusQuickAdd: () => void;
  openNewList: () => void;
  requestDelete: (taskId: string) => void;
  clearDeleteRequest: () => void;
}

export const useCommandStore = create<CommandStore>((set) => ({
  focusSearchNonce: 0,
  focusQuickAddNonce: 0,
  openNewListNonce: 0,
  deleteRequestId: null,

  focusSearch: () =>
    set((s) => ({ focusSearchNonce: s.focusSearchNonce + 1 })),
  focusQuickAdd: () =>
    set((s) => ({ focusQuickAddNonce: s.focusQuickAddNonce + 1 })),
  openNewList: () => set((s) => ({ openNewListNonce: s.openNewListNonce + 1 })),
  requestDelete: (deleteRequestId) => set({ deleteRequestId }),
  clearDeleteRequest: () => set({ deleteRequestId: null }),
}));
