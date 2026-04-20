# Phase 6 — Task List

**Status:** done

## Goal

Middle pane: renders any selected list (smart or user), sticky quick-add, pills, Completed accordion, sort menu.

## Scope

- `components/task-list/TaskList.tsx` — dispatches on `ListSelection` union, pulls from correct hook.
- `components/task-list/TaskRow.tsx` — checkbox, title, star, optional pills (due date, reminder, subtask count, notes indicator).
- `components/task-list/NewTaskInput.tsx` — sticky bottom input, creates task under current subgroup or derived context (My Day adds with `addedToMyDayAt = today`; Important adds with `isImportant = true`; Planned adds with `dueDate = today`).
- `components/task-list/CompletedAccordion.tsx` — collapsible, sorted by `completedAt` desc.
- `components/task-list/EmptyState.tsx` — per-smart-list empty state (copy varies per list).
- Sort menu: default (sortOrder) / by due / by importance / alphabetical — stored in `ui.store.ts`.

## Deliverables

All files under `src/lib/components/task-list/`.

## Verification

- Toggling checkbox moves task into Completed accordion instantly.
- Quick-add creates task under the correct list (derived context preserved for smart lists).
- Sort menu changes order without refetch.
- Empty states render for each smart list.

## Notes

- Pills come from single `TaskRow` — conditional rendering, not variants.
- Completed accordion defaults collapsed. Count in header.
