# List Themes

Status: **done** (implemented 2026-06-26)

## Implementation notes (deviations)

- Theme switcher is a **Palette icon button** in the list header opening a swatch popover (cleaner for color selection than a native-menu submenu, which can't show color swatches).
- Subgroup-delete theme cleanup **skipped** — stale `localStorage` keys are harmless and never re-read; avoided cross-layer coupling (service importing a store).
- Image-style themes (Ocean, Graphite) ship as layered gradient + inline SVG-pattern data URIs (no binary assets); real image files can be added later via the `kind: "image"` slot.

## Update — expanded (2026-06-26)

- **23 themes** (default + 22 hue-based), generated from a hue via `makeTheme()` — scales without hand-written CSS.
- **Applied via inline CSS variables** (`themeStyle(id, mode)`) instead of static `[data-theme]` blocks — required to scale to 20+ themes. Removed the per-theme CSS from `globals.css` (kept `.theme-surface`).
- **Switcher moved into menus**: a "Theme" item in the list-header `…` menu **and** the sidebar list right-click/`…` menu, opening a swatch `ThemeDialog`. Removed the standalone Palette button.
- **Paired light/dark backgrounds** (macOS-style): each theme has its own gradient *and* its own SVG pattern per mode (dark ink on light, light ink on dark).
- **Dark mode made vivid**: dark surfaces lifted to lightness ~0.22–0.29 with higher chroma so the theme reads clearly against the near-black base.
- New: `components/task-list/theme-dialog.component.tsx`. Removed: `theme-picker.component.tsx`.

Per-list visual themes for the task list view — each list (and smart list) remembers
its own theme: a themed background (gradient/pattern, a few image-style) plus an
accent-led palette that works in both light and dark mode. Mirrors Microsoft To Do.

## Decisions (locked)

- **Scope:** per-list. A theme colors the **task-list pane** (header + tasks area), not the sidebar.
- **Backgrounds:** hybrid — CSS gradient + SVG-pattern themes, plus a few richer "image-style" themes (layered gradient + SVG data-URI). Architecture supports real image files dropped in later.
- **Palette:** accent-led. A theme overrides `--primary` / `--accent` / `--ring` + a background layer. Card/text/border neutrals inherit the base tokens so contrast stays safe. Each theme defines a light and a dark variant.

## Architecture

Second token axis on top of the existing light/dark system (Tailwind v4 idiom):

- `data-theme="<id>"` on the **task-list root container**.
- CSS overrides token vars at `[data-theme="x"]` (light) and `.dark [data-theme="x"]` (dark).
- A background layer driven by `--theme-bg` / `--theme-bg-pattern`, rendered behind the task rows; rows keep `bg-card` for legibility.

### Storage

Theme selection is a persisted UI preference, keyed by list:

- New persisted Zustand store `stores/theme.store.ts` → `listThemes: Record<string, ThemeId>` keyed by `subgroup:<id>` / `smart:<id>`, with `setListTheme(key, id)`. Persisted to `localStorage` (`floatt:list-themes`). No Dexie schema change. Stale subgroup entries cleaned up in `deleteSubgroup` (optional, harmless otherwise).

### Theme catalog

`consts/themes.const.ts` → `THEMES: ThemeDef[]`:

```
{ id, label, swatch (css), kind: "gradient" | "pattern" | "image",
  light: { primary, accent, ring, bg, pattern? },
  dark:  { primary, accent, ring, bg, pattern? } }
```

Initial set (~7): Default (no bg), Indigo, Rose, Emerald, Sunset (gradients);
Ocean, Graphite (pattern/image-style). `default` = current look.

## Files

- `consts/themes.const.ts` — theme catalog + `ThemeId` type. **new**
- `styles/globals.css` — `[data-theme]` token overrides + background-layer CSS for each theme. **edit**
- `stores/theme.store.ts` — persisted per-list theme map. **new**
- `hooks/use-list-theme.ts` — read/set theme for a `ListSelection`. **new**
- `components/task-list/theme-picker.component.tsx` — swatch popover. **new**
- `components/task-list/task-list.component.tsx` — apply `data-theme` + bg layer on the pane root; add "Theme" action to the header `…` menu (both subgroup + smart). **edit**
- `services/subgroup.service.ts` — clean up theme entry on delete. **edit (small)**

## Out of scope (now)

- Real photographic image assets (slots wired; drop-in later).
- Per-list theme sync (app is local-first, no backend).

## Verification

- Switch a list's theme → pane bg + accent change; reload persists; switching list restores its theme.
- Toggle app light/dark → each theme shows its matching variant; text/cards stay legible.
- `pnpm check-types` + `pnpm --filter @floatt/app test` green on web; desktop type-check clean (except pre-existing vite.config error).
