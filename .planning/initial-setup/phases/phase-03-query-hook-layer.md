# Phase 3 — Query + Hook Layer

**Status:** done
**Completed:** 2026-04-20

## Goal

React-facing bindings: live Dexie queries per entity, smart-list derived queries, and all hooks. UI store defined. After this phase, a UI component can read and write the whole domain without touching services directly.

## Scope

- `queries/group.queries.ts`, `subgroup.queries.ts`, `task.queries.ts`, `subtask.queries.ts` — Dexie queryable builders.
- `queries/smart-list.queries.ts` — My Day, Important, Planned (with Today/Tomorrow/This week/Later bucketing), All.
- `stores/ui.store.ts` — Zustand: `selectedList` (ListSelection union), `selectedTaskId`, `theme`, `searchQuery`.
- `hooks/useGroups.ts`, `useSubgroups.ts`, `useTasks.ts` (by subgroupId), `useSubtasks.ts` (by taskId).
- `hooks/useMyDay.ts`, `useImportantTasks.ts`, `usePlannedTasks.ts`, `useAllTasks.ts`.
- `hooks/useSearch.ts` — wraps `search.service.ts`.
- `hooks/useReminders.ts` — registers scheduler on mount (Phase 8 fills it in).
- `hooks/useUiStore.ts` — selector sugar around the Zustand store.

## Deliverables

All files under `src/lib/{queries,stores,hooks}/`. `ThemeProvider` migrated to read from `ui.store.ts` (effect layer remains).

## Verification

- `pnpm build` passes.
- A throwaway probe component can call every hook and render its result without error.
- `useTasks(subgroupId)` reflects Dexie mutations live via `dexie-react-hooks`.

## Notes

- Separation: `queries/` returns Dexie queryables (composable). `hooks/` subscribes via `useLiveQuery`.
- Smart list queries share a `today()` derivation — pull from `utils/date.ts`.
