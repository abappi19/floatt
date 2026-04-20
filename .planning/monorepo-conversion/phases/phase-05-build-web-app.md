# Phase 5 — Build the Web App

**Status:** planned

## Goal

`apps/web` boots, renders the full Floatt UI, and uses the browser Notification API via the platform adapter.

## Scope

- `apps/web/index.html` — entry HTML.
- `apps/web/src/main.tsx`:
  - Imports `@floatt/app/styles/globals.css`.
  - Imports `App`, `PlatformProvider` from `@floatt/app`.
  - Wraps `<App />` with `<PlatformProvider value={webPlatform}>`.
- `apps/web/src/platform.web.ts` — browser implementations:
  - `notifications`: `window.Notification` API for `send` + `requestPermission`. `schedule` uses `setTimeout` keyed by id into a Map (cancel clears the timer). `isAvailable` checks `"Notification" in window`.
  - `opener.openUrl`: `window.open(url, "_blank", "noopener,noreferrer")`.
- `apps/web/vite.config.ts` — React plugin, Tailwind v4 plugin, `@source` or explicit content for `packages/app/src`. No Tauri host/port hooks. `optimizeDeps.exclude: ["@floatt/app"]`.
- `apps/web/package.json` — deps: `@floatt/app`, `@floatt/config`, `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `typescript`.

## Deliverables

- `apps/web/index.html`, `src/main.tsx`, `src/platform.web.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`

## Verification

- `pnpm --filter @floatt/web dev` → dev server starts (default 5173), Floatt renders in the browser.
- Creating a reminder prompts for browser notification permission; firing time produces a desktop notification via OS.
- No console errors referencing `@tauri-apps/*`.
- `pnpm --filter @floatt/web build` produces `apps/web/dist/` with hashed JS + CSS.

## Notes

- Scheduled reminders via `setTimeout` don't survive page reload — acceptable for web, or we rehydrate from IndexedDB on mount (fallback loop in a `useEffect`). Document this in the adapter.
- Add a `usePersistedSchedules` rehydration hook later if needed.
