# Phase 9 — Repeat Runtime

**Status:** pending

## Goal

Completing a recurring task spawns the next occurrence with correctly computed `dueDate`. Pure calculator is unit-testable in isolation.

## Scope

- `utils/repeat.ts` — pure function `nextOccurrence(repeat, fromDate)`. Handles:
  - `daily` — fromDate + interval days.
  - `weekdays` — next weekday (Fri → Mon, skips Sat/Sun).
  - `weekly` — fromDate + (7 × interval) days.
  - `monthly` — same day-of-month, clamp to last day (Jan 31 → Feb 28/29 → Mar 31).
  - `yearly` — same month + day, clamp for Feb 29 → Feb 28 on non-leap years.
- `services/repeat.service.ts` — `spawnNext(task)` — creates new task with computed `dueDate`, resets `isCompleted`, `completedAt`, `addedToMyDayAt`, preserves notes/reminder/repeat/importance/subgroup.
- `services/task.service.ts.toggleComplete` — if task has `repeat` and is being completed → mark complete + call `spawnNext`.
- Unit tests for `utils/repeat.ts` covering DST, month-end, Feb 29, weekday skip.

## Deliverables

`utils/repeat.ts`, `services/repeat.service.ts`, `services/task.service.ts` update, tests.

## Verification

- Unit tests green.
- Manual: complete a daily task → new task appears with `dueDate` = today + 1.
- Monthly Jan 31 repeat → completing creates Feb 28/29 next.
- Weekdays on Friday → next is Monday.

## Notes

- Subtasks do not copy over to the spawned task — MS Todo behaviour: subtasks are reset to template (carry titles but reset completion). Confirm with Bappi during implementation if unsure.
- Reminder on spawned task: shift by same delta (reminderAt relative to old dueDate → new dueDate). Decision to confirm.
