# Phase 9 — GitHub Actions for Tauri

**Status:** planned

## Goal

Tagged releases build signed Tauri installers for macOS, Linux, and Windows. PRs run lint + typecheck + test.

## Scope

- `.github/workflows/ci.yml`:
  - Triggers on `pull_request` and `push: branches: [main]`.
  - Ubuntu runner, setup pnpm + Node 20, `pnpm install --frozen-lockfile`.
  - Runs `pnpm turbo run lint check-types test`.
  - Optional: wire `TURBO_TOKEN` + `TURBO_TEAM` from secrets for remote cache hits.
- `.github/workflows/desktop.yml`:
  - Triggers on `push: tags: ['v*']` and `workflow_dispatch`.
  - Matrix: macos-latest, ubuntu-22.04, windows-latest.
  - Uses `tauri-apps/tauri-action@v0` with `projectPath: apps/desktop`.
  - Install system deps on Linux (libgtk, webkit2gtk, librsvg).
  - `args: --config src-tauri/tauri.conf.json` (default resolves).
  - Creates a GitHub Release on tag push, uploads platform artifacts.
  - Signing secrets via repo secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (optional — gated on whether auto-updater is used later).

## Deliverables

- `.github/workflows/ci.yml`
- `.github/workflows/desktop.yml`

## Verification

- Open a PR → `ci.yml` runs, passes lint/typecheck/test.
- Tag `v0.2.0` and push → `desktop.yml` runs, produces `.dmg`, `.AppImage`, `.msi` artifacts in the GitHub Release.
- Artifacts launch on each platform (manual check).

## Notes

- Skip codesigning on first pass — unsigned builds are fine for testing. Add signing secrets once there's a real release plan.
- Don't duplicate Vercel's job — `ci.yml` handles PR checks, Vercel handles web deploys, `desktop.yml` handles releases.
