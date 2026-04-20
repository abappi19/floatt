# Phase 12 — Search

**Status:** pending

## Goal

Fuzzy search across all tasks (titles + notes) and subtasks (titles + notes). Debounced input, results panel with list context pill.

## Scope

- `services/search.service.ts` — full implementation:
  - `buildIndex()` — reads all tasks + subtasks, builds Fuse.js index with weights (title > notes).
  - `rebuildOnMutation()` — subscribe to Dexie task + subtask mutations, debounce rebuild.
  - `query(term)` — returns hits with entity type + id + list context.
- `hooks/useSearch.ts` — debounced query binding to `ui.store.ts` search term.
- `components/search/SearchResults.tsx` — grouped results panel: Tasks first, then Subtasks. Each hit shows list pill (subgroup name or smart list label).
- Integration: search bar in sidebar drives search state; task list middle pane switches to results when search term is non-empty.

## Deliverables

`services/search.service.ts`, `hooks/useSearch.ts`, `components/search/SearchResults.tsx`, wiring in `TodoScreen.tsx`.

## Verification

- Type a query → results appear debounced (~150 ms).
- Click a result → selects that list and that task (open task detail).
- Clear query → return to prior list view.
- Mutation during search → index updates, next query reflects it.

## Notes

- Index build cost: for < 10k items, full rebuild on mutation is fine. Only optimize if profiling shows it.
- Fuse options: `threshold: 0.4`, `keys: [{name: 'title', weight: 2}, {name: 'notes', weight: 1}]`.
