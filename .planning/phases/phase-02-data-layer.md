# Phase 2 — Data Layer

**Status:** done
**Completed:** 2026-04-20

## Goal

Every domain type, schema, and service in place. Dexie v1 schema declared with all indexes upfront. Nothing UI-facing — pure data plumbing.

## Scope

- `types/` — Group, Subgroup, Task, Subtask, Repeat union, SmartListId, ListSelection.
- `schemas/` — Zod schemas for each entity; response vs form schemas split.
- `consts/db.consts.ts` — DB name (`floatt`), version (1), table names.
- `consts/smart-lists.consts.ts` — ids, icons, labels for My Day / Important / Planned / Tasks.
- `consts/app.consts.ts` — misc app constants.
- `services/db.service.ts` — Dexie instance, schema v1 with all indexes.
- `services/group.service.ts`, `subgroup.service.ts`, `task.service.ts`, `subtask.service.ts` — CRUD + domain ops.
- `services/repeat.service.ts` — spawn next occurrence on complete (uses `utils/repeat.ts`).
- `services/my-day.service.ts` — add/remove (no cleanup needed — filter does the work).
- `services/reorder.service.ts` — batched `sortOrder` updates.
- `services/search.service.ts` — Fuse.js index builder + query (stub; wired in Phase 12).
- `services/reminder.service.ts` — schedule/cancel via Tauri (stub; wired in Phase 8).
- `utils/date.ts` — `isToday`, `startOfDay`, `formatDue`, `relativeDue`.
- `utils/id.ts` — nanoid wrapper.
- `utils/repeat.ts` — pure next-occurrence calculator (unit-tested).

## Deliverables

All files under `src/lib/{types,schemas,consts,services,utils}/` per scaffold.

## Verification

- `pnpm build` passes.
- Dexie opens in a quick scratch test without schema errors.
- `utils/repeat.ts` unit tests cover: daily, weekdays (Fri → Mon), weekly with interval, monthly (Jan 31 → Feb 28/29 → Mar 31), yearly, DST transition.
- All services exported from their files; no circular imports.

## Notes

- Keep services thin — no UI concerns. Hooks (Phase 3) bind Dexie live queries to React.
- `reminder.service.ts` and `search.service.ts` are stubbed here and fully implemented in their runtime phases.
