# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Floatt is a local-first task manager (Microsoft To Do–style: groups → lists → tasks → steps, plus smart lists like My Day, Important, Planned). It ships as both a **web app** and a **Tauri desktop app** that share a single React codebase. There is no backend — all data lives in the browser/embedded IndexedDB via Dexie.

## Commands

Run from the repo root (pnpm + Turborepo):

```bash
pnpm dev            # run all dev servers via turbo
pnpm dev:web        # web app only (Next.js, @floatt/web)
pnpm dev:desktop    # desktop app (pnpm --filter @floatt/desktop tauri dev)
pnpm build          # build everything (next build → static export to out/ for web; tsc --noEmit && vite build for desktop)
pnpm test           # vitest run, all packages
pnpm check-types    # tsc --noEmit across packages

# Single package / single test
pnpm --filter @floatt/app test                       # tests in the shared package
pnpm --filter @floatt/app exec vitest run src/utils/repeat.test.ts
pnpm --filter @floatt/app exec vitest                 # watch mode
```

Notes:
- `pnpm lint` is wired through Turbo but **no linter is currently configured** (no ESLint/Biome config exists), so it is effectively a no-op.
- The desktop `tauri dev` command auto-starts the Vite dev server (`beforeDevCommand: pnpm dev`, devUrl `http://localhost:1420`). Desktop dev requires a Rust toolchain (`apps/desktop/src-tauri`).

## Architecture

### Monorepo layout

- `packages/app` (`@floatt/app`) — **all** shared UI, state, and business logic. This is where ~everything lives.
- `apps/web` (`@floatt/web`, **Next.js** App Router) and `apps/desktop` (`@floatt/desktop`, **Vite + Tauri**) — thin platform shells. Each does only one job: render `<App />` wrapped in `<PlatformProvider platform={...} />` with a platform-specific adapter. Desktop's entry is `src/main.tsx`; web's is `app/page.tsx` → a client-only `app/FloattApp.tsx` (`dynamic(..., { ssr: false })`, since everything is client-side IndexedDB).
- `packages/config` (`@floatt/config`) — shared `tsconfig` bases (`base.json`, `react.json`). App tsconfigs `extends` these.

**Implication:** new features and components almost always go in `packages/app/src`, not in the apps. Only touch `apps/*` when wiring platform capabilities.

### Platform abstraction (the key seam)

Shared code must never import `@tauri-apps/*` or browser-only notification APIs directly. Instead it calls `usePlatform()` (from `providers/PlatformProvider`) which returns a `Platform` (see `platform/platform.types.ts`: `notifications` + `opener`). Each app supplies the concrete implementation:
- `apps/web/src/platform.web.ts` — Web Notification API / `window.open`.
- `apps/desktop/src/platform.desktop.ts` — Tauri notification & opener plugins.

When adding a native capability, extend the `Platform` interface in the shared package, then implement it in both app adapters.

### Data + state layers (in `packages/app/src`)

Strict one-directional layering — respect it when adding features:

1. **`services/`** — all writes/mutations and business logic. Owns the Dexie `db` (`db.service.ts`). Examples: `task.service.ts`, `repeat.service.ts` (recurrence spawning), `reminder.service.ts` (notification scheduling), `reorder.service.ts`, `my-day.service.ts`.
2. **`queries/`** — pure read functions returning Promises off `db` (e.g. `getTasksBySubgroup`). No React.
3. **`hooks/`** — reactive bindings. Wrap queries in Dexie's `useLiveQuery` so components re-render on DB changes (e.g. `useTasks`, `useMyDay`, `useReminders`). Also where runtime effects mount.
4. **`components/` / `screens/`** — consume hooks; never touch `db` directly.

**Ephemeral/UI state** (selection, dialogs, command requests, toasts) lives in **Zustand** stores under `stores/` (`ui.store`, `command.store`, `toast.store`) — kept separate from persisted Dexie data.

### Data model

Hierarchy: **Group → Subgroup (a "list") → Task → Subtask (a "step")**. Types in `types/`, validated with Zod schemas in `schemas/`. Dexie schema + indexes are defined in `services/db.service.ts` (note compound indexes like `[subgroupId+sortOrder]` used for ordered queries). Booleans are stored as `Bit = 0 | 1` (so they can be indexed). Ordering uses a sparse `sortOrder` with `SORT_ORDER_STEP` gaps.

**Smart lists** (`my-day`, `important`, `planned`, `tasks` — see `types/smart-list.type.ts`, `consts/smart-lists.consts.ts`) are *virtual*: they have no table, they're computed by querying/filtering tasks.

### Runtime effects

Cross-cutting runtime behavior is started by hooks mounted in `App.tsx`'s `AppShell` (`useReminders`, `useKeyboardShortcuts`). `useReminders` drives `reminder.service`, which schedules native notifications when available and falls back to in-app `setTimeout`/toasts otherwise. Recurring tasks spawn their next occurrence via `repeat.service.spawnNextOccurrence` on completion.

### Styling & UI

Tailwind CSS v4, no separate config file — global styles in `packages/app/src/styles/globals.css`. Web wires it via `@tailwindcss/postcss` (`apps/web/postcss.config.mjs`); desktop via `@tailwindcss/vite`. UI primitives in `components/ui/` are shadcn-style wrappers over `radix-ui`, composed with `class-variance-authority` + the `cn()` util (`utils/cn.ts`). Drag-and-drop uses `@dnd-kit`; search uses `fuse.js`; dates use `date-fns`.

### Path aliases

Two aliases resolve to the shared package source and must stay in sync across configs:
- `@/*` → `packages/app/src/*` (configured in `packages/app/tsconfig.json`, the desktop `vite.config.ts`, and the web `tsconfig.json` `paths`).
- `@floatt/app/*` subpath exports (e.g. `@floatt/app/platform`, `@floatt/app/utils`) are declared in `packages/app/package.json` `exports`. Apps consume the package via these; the shared package itself uses `@/*` internally.

The workspace source is consumed directly (not pre-bundled): desktop's `vite.config.ts` sets `optimizeDeps.exclude: ["@floatt/app"]`; web's `next.config.mjs` sets `transpilePackages: ["@floatt/app"]`.
