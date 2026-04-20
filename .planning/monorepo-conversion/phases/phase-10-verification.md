# Phase 10 — Verification

**Status:** planned

## Goal

End-to-end proof: clean install, both apps run, both apps build, Vercel deploys, GitHub Actions releases.

## Scope

- Clean checkout: `rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist apps/desktop/src-tauri/target`.
- `pnpm install` resolves cleanly.
- `pnpm turbo run check-types lint test` passes.
- `pnpm turbo run build` builds `apps/web/dist/` and (optionally via a separate invocation) `apps/desktop` bundles.
- `pnpm --filter @floatt/web dev` → web app works in browser, notifications use Web Notification API.
- `pnpm --filter @floatt/desktop tauri dev` → desktop app works, notifications use Tauri plugin.
- Push branch → Vercel preview deploys, site loads.
- Tag `v0.2.0` → `desktop.yml` produces installers, GitHub Release created.
- Confirm no `@tauri-apps/*` imports in `apps/web/dist/assets/*.js` (`rg '@tauri-apps' apps/web/dist` should return nothing).

## Deliverables

- A short `README.md` at root documenting: dev commands, package structure, release flow.
- Close all three open questions from the plan.

## Verification

- All items in Scope pass.
- First real PR after merge sees cached Turbo tasks on Vercel (remote cache hit if enabled).
- Bundle size check on `apps/web/dist` — web bundle should shrink vs the original (no Tauri plugin code included).

## Notes

- If `@tauri-apps/*` imports leak into the web bundle, find the offending file in `packages/app/src` and move the usage behind the platform adapter.
- After this phase, the monorepo is live. Subsequent feature work follows the platform-adapter contract for any new native API.
