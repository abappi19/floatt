# Floatt

A local-first task manager in the spirit of Microsoft To Do — organize work as **groups → lists → tasks → steps**, with smart lists like **My Day**, **Important**, and **Planned**.

Floatt ships as both a **web app** and a **Tauri desktop app** from a single shared React codebase. There is no backend — all data lives on-device in IndexedDB (via Dexie), so the app works fully offline.

## Tech stack

- **React 19** + **TypeScript**
- **Next.js 15** (App Router) for the web app — static export
- **Vite** + **Tauri** for the desktop app
- **Dexie** (IndexedDB) for local-first persistence
- **Zustand** for ephemeral UI state
- **Tailwind CSS v4** + **radix-ui** primitives (shadcn-style)
- **@dnd-kit** (drag & drop), **fuse.js** (search), **date-fns** (dates)
- **pnpm** + **Turborepo** monorepo

## Monorepo layout

```
apps/
  web/        @floatt/web      — web shell (Next.js)
  desktop/    @floatt/desktop  — desktop shell (Vite + Tauri)
packages/
  app/        @floatt/app      — all shared UI, state, and business logic
  config/     @floatt/config   — shared tsconfig bases
```

Almost all features live in `packages/app/src`. The apps are thin platform shells: each `main.tsx` renders `<App />` inside a `<PlatformProvider>` with a platform-specific adapter (Web Notification API vs. Tauri plugins). Shared code never imports platform APIs directly — it goes through `usePlatform()`.

## Getting started

```bash
pnpm install        # install dependencies

pnpm dev            # run all dev servers via Turborepo
pnpm dev:web        # web app only (Next.js)
pnpm dev:desktop    # desktop app (Tauri — requires a Rust toolchain)
```

> Desktop development requires a [Rust toolchain](https://www.rust-lang.org/tools/install) for `apps/desktop/src-tauri`. `tauri dev` auto-starts the Vite dev server on `http://localhost:1420`.

## Scripts

```bash
pnpm build          # build everything (next build for web, vite build for desktop)
pnpm test           # run all tests (vitest)
pnpm check-types    # tsc --noEmit across packages

# single package / single test
pnpm --filter @floatt/app test
pnpm --filter @floatt/app exec vitest run src/utils/repeat.test.ts
pnpm --filter @floatt/app exec vitest          # watch mode
```

## Architecture

State flows in one direction inside `packages/app/src`:

1. **`services/`** — all writes/mutations and business logic; owns the Dexie `db`.
2. **`queries/`** — pure read functions returning Promises off `db`.
3. **`hooks/`** — reactive bindings via Dexie's `useLiveQuery`, plus runtime effects.
4. **`components/` / `screens/`** — consume hooks; never touch `db` directly.

The data model is **Group → Subgroup (a "list") → Task → Subtask (a "step")**, with types in `types/` validated by Zod schemas. Smart lists (`my-day`, `important`, `planned`, `tasks`) are *virtual* — computed by filtering tasks rather than stored in a table.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture guide.
