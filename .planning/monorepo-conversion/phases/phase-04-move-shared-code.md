# Phase 4 — Move Shared Code into `packages/app`

**Status:** done

## Goal

Mechanical migration. Move every shareable file from `src/` into `packages/app/src/` and fix imports.

## Scope

- Move `src/lib/*` → `packages/app/src/*` preserving structure: `components/`, `consts/`, `hooks/`, `queries/`, `schemas/`, `screens/`, `services/`, `stores/`, `types/`, `utils/`.
- Move `src/app/App.tsx` → `packages/app/src/App.tsx`.
- Move `src/app/providers/ThemeProvider.tsx`, `NotificationProvider.tsx`, `PlatformProvider.tsx` → `packages/app/src/providers/`.
- Move `src/app/styles/globals.css` → `packages/app/src/styles/globals.css`.
- Rewrite imports:
  - `@/lib/*` → relative paths within `packages/app/src` (or `@/*` alias if kept).
  - `@/app/providers/*` → relative.
  - External callers will use `@floatt/app` package-name imports (set up in Phase 5).
- `packages/app/src/index.ts` — barrel: re-export `App`, `PlatformProvider`, and types consumers need.
- `packages/app/package.json` — add deps currently in root `package.json` that the shared code actually uses (React, Dexie, Zustand, Radix, dnd-kit, date-fns, fuse.js, nanoid, react-hook-form, zod, class-variance-authority, clsx, tailwind-merge, lucide-react, etc.). React/react-dom as peer deps.
- Export CSS: add `"./styles/globals.css": "./src/styles/globals.css"` to the package's exports map.

## Deliverables

- Populated `packages/app/src/` tree
- `packages/app/package.json` with full dep list and exports
- `packages/app/src/index.ts` barrel

## Verification

- `pnpm --filter @floatt/app exec tsc --noEmit` compiles clean.
- No remaining imports from `@tauri-apps/*` anywhere in `packages/app/src/`.
- `src/lib/`, `src/app/` directories empty (entry files handled in Phase 5/6).

## Notes

- Peer deps: React + React DOM. Apps pin the actual versions.
- Path alias `@/*` inside `packages/app` is optional — relative imports work fine at this size.
