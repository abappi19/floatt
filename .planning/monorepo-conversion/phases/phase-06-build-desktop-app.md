# Phase 6 — Build the Desktop App

**Status:** done

## Goal

`apps/desktop` runs under Tauri with the same Floatt UI, using the Tauri plugin adapters. `src-tauri/` lives under `apps/desktop/`.

## Scope

- `apps/desktop/index.html`, `apps/desktop/src/main.tsx` — mirror the web entry but wrap with `desktopPlatform`.
- `apps/desktop/src/platform.desktop.ts`:
  - `notifications`: wraps `@tauri-apps/plugin-notification` (`isPermissionGranted`, `requestPermission`, `sendNotification`, `scheduleNotification`, `cancel`).
  - `opener.openUrl`: `@tauri-apps/plugin-opener`'s `openUrl`.
- `apps/desktop/vite.config.ts` — React + Tailwind plugins, port 1420, strictPort, Tauri HMR config, ignore `src-tauri/**` in watcher, `optimizeDeps.exclude: ["@floatt/app"]`.
- Move `src-tauri/` → `apps/desktop/src-tauri/`.
- Update `apps/desktop/src-tauri/tauri.conf.json`:
  - `beforeDevCommand: "pnpm dev"`, `beforeBuildCommand: "pnpm build"` (run from `apps/desktop/`).
  - `frontendDist: "../dist"` stays (dist is at `apps/desktop/dist`).
- `apps/desktop/package.json` — deps: `@floatt/app`, `@floatt/config`, `react`, `react-dom`, `@tauri-apps/api`, `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-opener`. devDeps: `@tauri-apps/cli`, `vite`, etc. Script: `"tauri": "tauri"`.

## Deliverables

- `apps/desktop/index.html`, `src/main.tsx`, `src/platform.desktop.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`
- Relocated `apps/desktop/src-tauri/` with updated `tauri.conf.json`

## Verification

- `pnpm --filter @floatt/desktop tauri dev` opens the desktop window, renders Floatt, reminders fire via native OS notification.
- `pnpm --filter @floatt/desktop tauri build` produces platform installers in `apps/desktop/src-tauri/target/release/bundle/`.
- Old root `src/`, root `src-tauri/`, root `index.html`, root `vite.config.ts`, root `dist/` are gone.

## Notes

- Cargo paths in `src-tauri/Cargo.toml` are relative to `src-tauri/` itself — no change needed after the move.
- `src-tauri/capabilities/default.json` stays intact (notification permission already declared in Phase 1).
