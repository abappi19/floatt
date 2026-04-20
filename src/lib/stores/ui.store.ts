import { create } from "zustand";
import type { ListSelection } from "@/lib/types";

export type Theme = "light" | "dark";
export type TaskSort = "default" | "due" | "importance" | "alpha";

const THEME_STORAGE_KEY = "floatt:theme";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface UiStore {
  selectedList: ListSelection;
  selectedTaskId: string | null;
  theme: Theme;
  searchQuery: string;
  taskSort: TaskSort;

  selectList: (selection: ListSelection) => void;
  selectTask: (id: string | null) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSearchQuery: (q: string) => void;
  setTaskSort: (sort: TaskSort) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedList: { kind: "smart", id: "my-day" },
  selectedTaskId: null,
  theme: readInitialTheme(),
  searchQuery: "",
  taskSort: "default",

  selectList: (selectedList) =>
    set({ selectedList, selectedTaskId: null, taskSort: "default" }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTaskSort: (taskSort) => set({ taskSort }),
}));

export { THEME_STORAGE_KEY };
