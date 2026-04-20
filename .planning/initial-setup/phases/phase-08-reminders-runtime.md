# Phase 8 — Reminders Runtime

**Status:** pending

## Goal

OS-level notifications fire at each task's `reminderAt`. Survives reloads. Gracefully degrades when permission denied.

## Scope

- `services/reminder.service.ts` — full implementation:
  - `scheduleAll()` — reads all tasks with `reminderAt` in the future, registers via `@tauri-apps/plugin-notification`.
  - `schedule(taskId)` — register one.
  - `cancel(taskId)` — cancel one.
  - `rescheduleAll()` — cancel + schedule all (for when a task changes).
- `hooks/useReminders.ts` — mounts on App, calls `scheduleAll()` once, re-runs on reminder create/delete via a Dexie subscription.
- Permission denied fallback — in-app toast at the scheduled time (using a setTimeout fallback when Tauri permission is not granted).

## Deliverables

`reminder.service.ts` filled in, `useReminders.ts` wired in `App.tsx`.

## Verification

- Set reminder 1 minute out → OS notification fires.
- Delete the task → notification is cancelled.
- Deny permission at first prompt → reminders show as in-app toast fallback instead.
- Reload app with existing reminders → all re-scheduled.

## Notes

- Tauri `plugin-notification` scheduled notifications: use `sendNotification` with schedule option if supported, otherwise maintain an in-process timer map keyed by taskId.
- Don't schedule past-due reminders.
