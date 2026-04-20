# Floatt — Microsoft Todo Clone

Local-first desktop app, full feature parity with MS Todo's consumer surface.

---

## Stack

**Core**

- Tauri 2 + React 19 + Vite
- Dexie + dexie-react-hooks
- shadcn/ui (Tailwind v4 + Radix + lucide-react)
- Zustand (UI state)
- React Hook Form + Zod (forms)

**Added for parity**

- @dnd-kit/core + @dnd-kit/sortable — drag-to-reorder (tasks, subtasks, sidebar)
- @tauri-apps/plugin-notification — native OS reminders
- date-fns — due dates, My Day, Planned, repeat math
- nanoid — stable IDs
- fuse.js — fuzzy search across tasks/notes

---

## In-Scope Features

| Feature                                                       | In  |
| ------------------------------------------------------------- | --- |
| Groups, subgroups (lists), tasks, subtasks (steps)            | ✓   |
| Notes on tasks and subtasks                                   | ✓   |
| Due date (set / clear / display)                              | ✓   |
| Reminder (OS notification at set time)                        | ✓   |
| Repeat (daily / weekdays / weekly / monthly / yearly)         | ✓   |
| Important / star                                              | ✓   |
| My Day (add, auto-clears next day)                            | ✓   |
| Smart lists — My Day, Important, Planned, Tasks               | ✓   |
| Completed accordion at bottom of list                         | ✓   |
| Search (fuzzy over titles + notes)                            | ✓   |
| Drag-to-reorder (tasks, subtasks, sidebar lists + groups)     | ✓   |
| Dark mode                                                     | ✓   |
| Context menu (rename, delete, move)                           | ✓   |

## Out of Scope

Account sync, sharing with others, attachments/file upload, Planner integration, Flagged emails, Assigned to me. These are tied to Microsoft 365. Local-first desktop app only.

---

## Data Model

```ts
Group {
  id
  name
  sortOrder
  isCollapsed
  createdAt
}

Subgroup {
  id
  name
  groupId           // nullable — standalone if null
  sortOrder
  createdAt
}

Task {
  id
  title
  isCompleted
  completedAt?      // for sort in Completed section
  notes             // free text
  subgroupId        // home list
  sortOrder
  dueDate?          // ISO date (day-precision)
  reminderAt?       // ISO datetime (minute-precision)
  repeat?           // { kind: 'daily'|'weekdays'|'weekly'|'monthly'|'yearly', interval: number } | null
  isImportant       // boolean
  addedToMyDayAt?   // ISO date (day) — "in My Day" iff === today
  createdAt
  updatedAt
}

Subtask {
  id
  title
  isCompleted
  notes             // free text
  taskId
  sortOrder
  createdAt
  updatedAt
}
```

**Smart lists are derived, not tables:**

- My Day → `addedToMyDayAt === today()`
- Important → `isImportant === true`
- Planned → `dueDate != null` (grouped by Today / Tomorrow / This week / Later)
- Tasks → all non-completed tasks across all lists

**Dexie v1 indexes (all declared upfront):**

- Task: `id`, `subgroupId`, `dueDate`, `isImportant`, `addedToMyDayAt`, `reminderAt`, `[subgroupId+sortOrder]`, `[isCompleted+subgroupId]`
- Subtask: `id`, `taskId`, `[taskId+sortOrder]`
- Group: `id`, `sortOrder`
- Subgroup: `id`, `groupId`, `sortOrder`, `[groupId+sortOrder]`

Any later schema change = explicit v2 upgrade.

---

## Folder Scaffold

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/                       # shadcn primitives
│   │   ├── sidebar/
│   │   ├── task-list/
│   │   ├── task-detail/
│   │   ├── search/
│   │   └── theme/
│   ├── consts/
│   ├── hooks/
│   ├── queries/
│   ├── schemas/
│   ├── screens/
│   │   └── TodoScreen.tsx            # 3-pane composition
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
└── app/
    ├── App.tsx
    ├── main.tsx
    ├── providers/
    │   ├── ThemeProvider.tsx
    │   └── NotificationProvider.tsx
    └── styles/
        └── globals.css
```

---

## Import Rule

| Folder                                       | Imports from                                                       |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `components/`, `screens/`                    | `hooks/`, `stores/`, `types/`, `schemas/`, `components/`, `utils/`, `consts/` |
| `hooks/`                                     | `queries/`, `services/`, `stores/`, `types/`, `schemas/`           |
| `services/`                                  | `db.service.ts`, other services, `types/`, `schemas/`, `utils/`, `consts/` |
| `queries/`                                   | `db.service.ts`, `types/`, `consts/`                               |
| leaves (`types/`, `schemas/`, `utils/`, `consts/`) | each other only                                              |

No ESLint rule yet — relying on discipline. If it slips, add `eslint-plugin-boundaries`.

---

## UI Layout — MS Todo 3-Pane

**Sidebar (left)**

- Top: search bar
- Smart lists: My Day • Important • Planned • Tasks (with live counts)
- Separator
- Groups (collapsible) → Subgroups nested inside
- Standalone subgroups at root
- Bottom: "+ New list", "+ New group", theme toggle

**Task list (middle) — selected list (smart or user)**

- Header: list name, task count, sort menu (default / by due / by importance / alphabetical)
- Body: pending tasks → Completed (N) collapsible at bottom
- Each row: checkbox, title, (optional pills: due date, reminder, subtask count, notes indicator, star)
- Sticky quick-add input at bottom

**Task detail (right) — opens when a task is selected**

- Editable title + star toggle
- Subtask list (add, toggle, rename, delete; each with collapsible notes field)
- Action buttons: Add to My Day • Remind me • Due date • Repeat
- Task notes textarea
- Timestamp footer ("Created 3h ago")

---

## Phase Index

| #  | Phase                                      | Status      |
| -- | ------------------------------------------ | ----------- |
| 1  | [Foundation](phases/phase-01-foundation.md) | done        |
| 2  | [Data layer](phases/phase-02-data-layer.md) | done        |
| 3  | [Query + hook layer](phases/phase-03-query-hook-layer.md) | done    |
| 4  | [UI primitives](phases/phase-04-ui-primitives.md) | done    |
| 5  | [Sidebar](phases/phase-05-sidebar.md)      | done        |
| 6  | [Task list](phases/phase-06-task-list.md)  | done        |
| 7  | [Task detail](phases/phase-07-task-detail.md) | done     |
| 8  | [Reminders runtime](phases/phase-08-reminders-runtime.md) | done |
| 9  | [Repeat runtime](phases/phase-09-repeat-runtime.md) | done |
| 10 | [My Day runtime](phases/phase-10-my-day-runtime.md) | done |
| 11 | [Drag-to-reorder](phases/phase-11-drag-reorder.md) | done        |
| 12 | [Search](phases/phase-12-search.md)        | done        |
| 13 | [Polish](phases/phase-13-polish.md)        | pending     |

---

## Risks

- **Tauri notification permission** — first-launch permission prompt; app must handle declined gracefully (reminders become in-app toasts instead).
- **Dexie v1 schema discipline** — all indexes declared upfront. Any later change = explicit v2 upgrade.
- **Repeat correctness** — pure next-occurrence calculator must handle DST, month-end (Jan 31 → Feb 28/29), weekday skips. Unit-testable in isolation.
- **dnd-kit across heterogeneous sidebar items** (groups vs subgroups vs standalone) — needs careful drop-zone logic. Isolated in `reorder.service.ts`.
- **Import boundary drift** — no ESLint rule yet. If it slips mid-build, add `eslint-plugin-boundaries`.
- **Scope honesty** — this is ~2–3× the original plan. Real work.
