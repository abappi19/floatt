# Phase 11 — Drag-to-Reorder

**Status:** pending

## Goal

Drag to reorder works on: tasks within a list, subtasks within a task, subgroups within a group, groups within sidebar, subgroups across groups. Batched `sortOrder` updates via service.

## Scope

- `services/reorder.service.ts` — full implementation:
  - `reorderTasks(subgroupId, fromIndex, toIndex)` — batch `sortOrder` updates in one Dexie transaction.
  - `reorderSubtasks(taskId, fromIndex, toIndex)` — same for subtasks.
  - `reorderSubgroupsInGroup(groupId, fromIndex, toIndex)`.
  - `moveSubgroupToGroup(subgroupId, targetGroupId, toIndex)` — cross-group move.
  - `reorderGroups(fromIndex, toIndex)`.
- `TaskList.tsx`, `SubtaskList.tsx` — wrap with `DndContext` + `SortableContext`.
- `Sidebar.tsx` — heterogeneous drop logic: drop zones for groups, subgroups inside group, standalone subgroups at root.
- Modifiers: `restrictToParentElement` per list, `restrictToVerticalAxis`.

## Deliverables

`services/reorder.service.ts`, dnd wiring in the three components.

## Verification

- Reorder tasks → order persists on reload.
- Reorder subtasks → same.
- Drag subgroup within a group → persists.
- Drag subgroup from Group A to Group B at position N → persists with correct `groupId` + `sortOrder`.
- Drag subgroup out of any group → becomes standalone (groupId = null).
- Reorder groups → persists.

## Notes

- Sidebar cross-type drops are the tricky part. Treat groups and subgroups as separate sortable contexts with explicit drop-zone hit-testing.
- `sortOrder` strategy: renumber in increments of 1000 on reorder; re-normalize if gaps get too narrow.
- Use `@dnd-kit/modifiers` for axis constraints; `@dnd-kit/sortable` for list reordering.
