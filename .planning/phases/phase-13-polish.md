# Phase 13 — Polish

**Status:** pending

## Goal

Ship-ready finish: empty states everywhere, dark mode pass, keyboard shortcuts, subtle transitions, final MS Todo visual parity check.

## Scope

- Empty states for every smart list + every user list (distinct copy per context).
- Dark mode pass: verify every surface in both themes. Fix contrast / muted issues.
- Keyboard shortcuts:
  - `⌘N` new task (focus quick-add)
  - `⌘⇧N` new list dialog
  - `⌘F` focus search
  - `⌫` delete selected task (with confirm)
  - `Enter` on hover → open task detail
  - `Space` → toggle complete
- Transitions: Completed accordion expand/collapse, task detail slide-in, row hover fade. Reanimated not needed — CSS + shadcn animations sufficient.
- Final visual pass against MS Todo screenshots. Adjust spacing / typography / row heights.
- My Day "Tip" affordance (deferred from Phase 10) — suggestions panel.

## Deliverables

Refinements across components. No new files expected.

## Verification

- Side-by-side with MS Todo → visual parity at default window size.
- All shortcuts work in dev build.
- Dark mode has no unreadable or mis-colored surface.
- Empty states render for each entry point.

## Notes

- Commit list for this phase is intentionally open-ended. Keep commits small and themed (one commit per polish area).
- If parity vs pragmatism conflicts — pragmatism wins. Don't chase pixel perfection.
