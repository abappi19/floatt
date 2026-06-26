# Plan: Naming Convention Migration

**Status:** done
**Started:** 2026-06-25
**Completed:** 2026-06-25

## Problem

`packages/app/src` mixes naming styles — PascalCase components with no suffix, camelCase hooks, plural `*.consts.ts`/`*.queries.ts`, suffix-less utils. Bappi's convention assigns every file a layer suffix so its role is unambiguous. The package itself is the feature unit (future features become sibling packages: `packages/notes`, etc.), so the work is normalizing the layer folders + file suffixes inside the package.

## Constraints

- `@/*` alias and `@floatt/app` subpath exports must keep resolving — apps consume only barrels/subpaths, so they must not need edits.
- shadcn `ui/` primitives get `.ui.tsx` (accepted: future `shadcn add` needs manual rename).
- Exported React symbols stay PascalCase; only filenames change to kebab-case.

## Approach

Scripted rename + import rewrite. A migration script computes the new name per layer rule, `git mv`s each file (preserving history), then resolves and rewrites every relative/`@/` import specifier against a module map. `tsc --noEmit` is the safety net. CLAUDE.md updated to document the convention.

### Convention

| Layer | Rule |
| --- | --- |
| components (non-ui) | `kebab.component.tsx` |
| components/ui | `name.ui.tsx` |
| screens | `name.screen.tsx` (strip `Screen`) |
| providers | `name.provider.tsx` (strip `Provider`) |
| hooks | `use-name.ts` |
| queries | `name.query.ts` |
| consts | `name.const.ts` |
| utils | `name.util.ts` |
| platform types | `platform.type.ts` |
| services/schemas/types/stores | already conform |

`index.ts` barrels, `App.tsx` (root entry), and `styles/` are left as-is.

## Risks & Edge Cases

- Broken import specifier → caught by `tsc --noEmit`.
- `repeat.test.ts` → `repeat.util.test.ts`; non-component `.ts` in component folders (`tree.ts`) → `.util.ts`.
- Side-effect CSS imports must be left untouched.

## Tasks

- [x] Run migration script (git mv + import rewrite) — 86 files renamed, imports rewritten in 61
- [x] `tsc --noEmit` green for @floatt/app + @floatt/web; 12/12 tests pass (desktop vite.config TS2578 is pre-existing, unrelated)
- [x] Update CLAUDE.md naming section
- [ ] Commit
