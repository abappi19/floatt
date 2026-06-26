import { useListThemeStore } from "@/stores";
import type { ThemeId } from "@/consts";
import type { ListSelection } from "@/types";

export function listThemeKey(selection: ListSelection): string {
  return `${selection.kind}:${selection.id}`;
}

export function useListTheme(selection: ListSelection): ThemeId {
  return useListThemeStore((s) => s.listThemes[listThemeKey(selection)] ?? "default");
}

export function useSetListTheme(): (key: string, id: ThemeId) => void {
  return useListThemeStore((s) => s.setListTheme);
}
