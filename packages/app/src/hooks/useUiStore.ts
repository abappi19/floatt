import { useUiStore } from "@/stores";

export { useUiStore };

export const useSelectedList = () => useUiStore((s) => s.selectedList);
export const useSelectedTaskId = () => useUiStore((s) => s.selectedTaskId);
export const useTheme = () => useUiStore((s) => s.theme);
export const useSearchQuery = () => useUiStore((s) => s.searchQuery);
export const useTaskSort = () => useUiStore((s) => s.taskSort);

export const useSelectList = () => useUiStore((s) => s.selectList);
export const useSelectTask = () => useUiStore((s) => s.selectTask);
export const useSetTheme = () => useUiStore((s) => s.setTheme);
export const useToggleTheme = () => useUiStore((s) => s.toggleTheme);
export const useSetSearchQuery = () => useUiStore((s) => s.setSearchQuery);
export const useSetTaskSort = () => useUiStore((s) => s.setTaskSort);
