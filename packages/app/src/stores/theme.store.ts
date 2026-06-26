import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeId } from "@/consts";

interface ListThemeStore {
  /** Theme per list, keyed by `subgroup:<id>` / `smart:<id>`. */
  listThemes: Record<string, ThemeId>;
  setListTheme: (key: string, id: ThemeId) => void;
}

export const useListThemeStore = create<ListThemeStore>()(
  persist(
    (set) => ({
      listThemes: {},
      setListTheme: (key, id) =>
        set((s) => ({ listThemes: { ...s.listThemes, [key]: id } })),
    }),
    { name: "floatt:list-themes" },
  ),
);
