# Phase 5 — Sidebar

**Status:** done
**Completed:** 2026-04-20

## Goal

Full left pane: search bar, smart list section with live counts, groups tree, standalone subgroups, context menu, new list/group dialogs.

## Scope

- `components/sidebar/Sidebar.tsx` — layout shell.
- `components/sidebar/SmartListSection.tsx` — My Day / Important / Planned / Tasks with live counts from Phase 3 hooks.
- `components/sidebar/GroupItem.tsx` — collapsible group, chevron, count.
- `components/sidebar/SubgroupItem.tsx` — selectable row, count pill.
- `components/sidebar/SidebarContextMenu.tsx` — rename / delete / move.
- `components/sidebar/NewListDialog.tsx` — RHF + Zod, creates subgroup.
- `components/sidebar/NewGroupDialog.tsx` — RHF + Zod, creates group.
- `components/search/SearchBar.tsx` — wired input, updates `ui.store.ts` search query.
- `components/theme/ThemeToggle.tsx` — bottom-bar toggle.
- Selection wired via `ui.store.ts` `selectedList` union.

## Deliverables

All files under `src/lib/components/sidebar/`, `search/`, `theme/`.

## Verification

- Click smart list → task list header updates.
- Click subgroup → task list shows that subgroup's tasks.
- Rename / delete / move via context menu mutate Dexie live.
- Group collapse persists (store in `Group.isCollapsed`).
- Theme toggle works from sidebar footer (previously on TodoScreen placeholder).

## Notes

- Drag-reorder inside sidebar is Phase 11, not here. Sidebar renders static-order (by `sortOrder`) for now.
- Search results panel is Phase 12. Search bar just writes to store here.
