# Phase 4 — UI Primitives

**Status:** done
**Completed:** 2026-04-20

## Goal

Small wrappers around shadcn primitives where the defaults don't fit. Kept lean — override only what's needed.

## Scope

- Calendar — themed to match sidebar/popover tokens, week-start configured.
- Popover trigger styles — unified padding/radius across Due Date / Reminder / Repeat pickers.
- Dialog — confirm-destructive variant for delete.
- Checkbox — round variant matching MS Todo visual style.
- Any shared primitive compositions surfaced once Phases 5–7 start.

## Deliverables

Additions under `src/lib/components/ui/` (either new files or small patches to existing shadcn-generated files). Prefer new wrapper components over editing generated primitives.

## Verification

- `pnpm build` passes.
- Visual parity check against MS Todo screenshots for calendar, popover, and checkbox.

## Notes

- Keep the list short. Only add a wrapper when a real consumer needs it. Speculative primitives get deleted.
