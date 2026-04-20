# Phase 7 — Turbo Pipeline

**Status:** planned

## Goal

Turborepo runs `dev`, `build`, `lint`, `check-types`, `test` across the workspace with proper dependency order and caching.

## Scope

- `turbo.json` at root:
  ```json
  {
    "$schema": "https://turbo.build/schema.json",
    "tasks": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**", "!dist/cache/**"]
      },
      "dev": { "cache": false, "persistent": true },
      "lint": { "dependsOn": ["^lint"] },
      "check-types": {
        "dependsOn": ["^check-types"],
        "inputs": ["**/*.{ts,tsx}"],
        "cache": false
      },
      "test": {
        "dependsOn": ["^build"],
        "inputs": ["**/*.{ts,tsx}", "**/*.test.{ts,tsx}"]
      }
    },
    "globalEnv": ["VITE_*"]
  }
  ```
- Root `package.json` scripts: `dev`, `build`, `lint`, `check-types`, `test` → `turbo run …`. Scoped scripts for per-app work: `dev:web`, `dev:desktop`.
- Each workspace's `package.json` declares the tasks it supports (`build`, `check-types`, `test`, `lint` where applicable).
- Move `vitest` config into `packages/app/` so the existing `utils/repeat.test.ts` runs from there.

## Deliverables

- `turbo.json`
- Updated root + workspace `package.json` scripts
- `packages/app/vitest.config.ts`

## Verification

- `pnpm build` builds both apps; second run hits cache (`>>> FULL TURBO`).
- `pnpm test` runs `repeat.test.ts` and passes.
- `pnpm check-types` clean across all workspaces.
- `pnpm dev --filter=@floatt/web` runs only the web dev server.

## Notes

- `globalEnv: ["VITE_*"]` catches any `VITE_*` env vars by prefix (Vite convention).
- Don't add Husky / lint-staged here — separate concern.
