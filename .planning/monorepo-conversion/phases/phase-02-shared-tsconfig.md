# Phase 2 — Shared tsconfig

**Status:** done

## Goal

Single source of truth for TypeScript compiler options. Every workspace extends a base.

## Scope

- Create `packages/config/tsconfig/base.json` with the strict compiler options currently in the root `tsconfig.json` (target ES2020, strict, noUnusedLocals, isolatedModules, etc.).
- Create `packages/config/tsconfig/react.json` extending base — adds `"jsx": "react-jsx"`, DOM libs, bundler moduleResolution.
- `packages/config/package.json` declares `"files": ["tsconfig"]` and an `exports` map.
- Each workspace has its own `tsconfig.json` that extends `@floatt/config/tsconfig/react.json` and sets its own `paths` / `include`.
- `packages/app` uses path alias `@floatt/app/*` pointing to its `src/*`. Apps import via the package name, not path alias.

## Deliverables

- `packages/config/tsconfig/base.json`
- `packages/config/tsconfig/react.json`
- `packages/config/package.json`
- `packages/app/tsconfig.json`
- `apps/web/tsconfig.json`, `apps/desktop/tsconfig.json`

## Verification

- `pnpm --filter @floatt/app exec tsc --noEmit` compiles clean (empty src is fine).
- Strict mode options match what was in the old root tsconfig — no regression in type strictness.

## Notes

- Keep the old root `tsconfig.json` for now — it still serves the un-migrated `src/` until Phase 4.
- `tsconfig.node.json` stays at root temporarily; moves with `vite.config.ts` in Phase 5/6.
