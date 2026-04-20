# Phase 1 — Workspace Scaffolding

**Status:** planned

## Goal

Stand up the pnpm + Turborepo workspace skeleton. No code moves yet — just the empty directory tree and workspace resolution.

## Scope

- Add `pnpm-workspace.yaml` listing `apps/*` and `packages/*`.
- Replace root `package.json` with a workspace root: `private: true`, no deps, scripts call `turbo`.
- Create empty `apps/web/`, `apps/desktop/`, `packages/app/`, `packages/config/` directories — each with a stub `package.json` (`"name": "@floatt/web" | "@floatt/desktop" | "@floatt/app" | "@floatt/config"`, `private: true`).
- Install `turbo` at the root as a dev dep.
- Update `.gitignore` for `.turbo/`, per-app `dist/`, per-app `node_modules/`.

## Deliverables

- `pnpm-workspace.yaml`
- Root `package.json` (scripts: `dev`, `build`, `lint`, `test`, `check-types` → `turbo run …`)
- `apps/web/package.json`, `apps/desktop/package.json`, `packages/app/package.json`, `packages/config/package.json` (stubs)
- `.gitignore` additions

## Verification

- `pnpm install` at the root resolves the workspace graph with no errors.
- `pnpm -r exec -- echo ok` runs across all four workspaces.
- `node_modules/.pnpm` contains the four `@floatt/*` symlinks.

## Notes

- Keep pnpm-lock.yaml — don't blow it away. New deps get added as we go.
- No source files move in this phase. Existing `src/`, `src-tauri/`, `dist/`, `index.html`, `vite.config.ts`, `tsconfig.json` stay put until Phase 4.
