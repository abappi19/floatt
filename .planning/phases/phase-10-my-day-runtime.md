# Phase 10 — My Day Runtime

**Status:** pending

## Goal

My Day is a live filter — tasks appear iff `addedToMyDayAt === today()`. No cleanup job needed.

## Scope

- `hooks/useMyDay.ts` — already exists from Phase 3, confirms filter against `startOfToday()`.
- `services/my-day.service.ts` — `add(taskId)` sets `addedToMyDayAt = today()`, `remove(taskId)` sets `null`.
- "Suggestions" panel (optional, if time): yesterday's unfinished tasks, Planned tasks due today, recently added tasks. Follows MS Todo "Tip" affordance. Can be deferred to Phase 13 polish.

## Deliverables

`services/my-day.service.ts`, confirmation pass on hook + queries.

## Verification

- Add task to My Day → shows in My Day smart list.
- Next day, same task → disappears (filter sees `addedToMyDayAt !== today`).
- Remove from My Day → disappears same day.
- Original task still lives in its home subgroup — My Day is just a lens.

## Notes

- No scheduled cleanup job. The filter is the cleanup.
- Consider a "My Day reset" visible affordance at midnight boundary — minor UX. Phase 13 polish.
