# Phase 1 — Foundation

**Status:** done
**Completed:** 2026-04-20

## Goal

Runway for everything else — deps installed, styling system live, folder tree scaffolded, Tauri notification plugin wired, provider shell rendering a placeholder 3-pane screen with a working dark-mode toggle.

## Scope

- Install all JS deps (data, state, forms, dnd, Tauri plugin, search, dates, ids, Tailwind v4, shadcn utils).
- Path alias `@/*` in tsconfig + vite.
- Tailwind v4 + shadcn Neutral theme (light + dark tokens, `.dark` class strategy).
- 12 shadcn primitives (button, input, textarea, checkbox, dialog, dropdown-menu, popover, calendar, tooltip, switch, scroll-area, separator).
- Folder tree with `.gitkeep` on empties.
- Tauri notification plugin — Cargo dep, `lib.rs` registration, `capabilities/default.json` permission.
- `ThemeProvider` + `NotificationProvider`.
- `App.tsx` composition, `TodoScreen.tsx` placeholder, entry point moved to `src/app/main.tsx`.

## Deliverables

- `package.json` — deps added
- `tsconfig.json` — `@/*` paths
- `vite.config.ts` — `@tailwindcss/vite` plugin + alias
- `components.json` — shadcn config (New York style, neutral base, CSS vars)
- `src/app/styles/globals.css` — Tailwind v4 imports, tokens, `@theme inline`
- `src/lib/utils/cn.ts`
- `src/lib/components/ui/*` — 12 primitives
- `src/app/providers/ThemeProvider.tsx`
- `src/app/providers/NotificationProvider.tsx`
- `src/lib/screens/TodoScreen.tsx` — placeholder 3-pane
- `src/app/App.tsx`, `src/app/main.tsx`, `src/app/vite-env.d.ts`
- `src-tauri/Cargo.toml` — `tauri-plugin-notification = "2"`
- `src-tauri/src/lib.rs` — plugin registered
- `src-tauri/capabilities/default.json` — `notification:default`
- `src-tauri/tauri.conf.json` — window 1200×800 min 900×600, title "Floatt"
- `index.html` — title, new entry path

## Verification

- `pnpm build` → tsc + vite build clean (72 kB gzip JS, 7 kB gzip CSS).
- `cargo check` in `src-tauri` → Rust compiles, notification plugin linked.
- `notification:default` accepted by tauri-build codegen.
- `pnpm tauri dev` (Bappi eyeball) → window opens, 3-pane placeholder visible, dark toggle works, OS permission prompt on first launch.

## Notes

- Removed Tauri default scaffold (`src/App.tsx`, `App.css`, `main.tsx`, `assets/`).
- `lucide-react 1.8.0` installed — modern version number, imports resolved cleanly.
- Theme persists to `localStorage` under `floatt:theme` with system-pref fallback. Will likely migrate to `ui.store.ts` in Phase 3 (effect layer stays in provider).
