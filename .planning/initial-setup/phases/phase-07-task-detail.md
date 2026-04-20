# Phase 7 — Task Detail

**Status:** pending

## Goal

Right pane: full task detail with subtasks (each with collapsible notes), due date, reminder, repeat, star, My Day, task notes.

## Scope

- `components/task-detail/TaskDetail.tsx` — layout shell.
- `components/task-detail/TaskDetailHeader.tsx` — editable title + star toggle.
- `components/task-detail/SubtaskList.tsx` + `SubtaskRow.tsx` — add, toggle, rename, delete.
- `components/task-detail/SubtaskNotesEditor.tsx` — per-subtask notes, collapsible.
- `components/task-detail/NotesEditor.tsx` — task-level free-text notes.
- `components/task-detail/DueDatePicker.tsx` — popover + Calendar, set/clear.
- `components/task-detail/ReminderPicker.tsx` — popover + date+time picker.
- `components/task-detail/RepeatPicker.tsx` — popover + kind/interval form (RHF).
- `components/task-detail/AddToMyDayButton.tsx` — toggles `addedToMyDayAt`.
- Timestamp footer — "Created Nh ago" via `utils/date.ts`.

## Deliverables

All files under `src/lib/components/task-detail/`.

## Verification

- Edit title → persists on blur / enter.
- Add subtask → persists, orderable (Phase 11), toggleable.
- Due date / reminder / repeat / star / My Day all persist and reflect in the task list pills.
- Notes field autosaves on blur.

## Notes

- Reminder runtime scheduling happens in Phase 8 — this phase just writes `reminderAt` to the task.
- Repeat runtime (spawn next on complete) happens in Phase 9 — this phase just writes `repeat` to the task.
