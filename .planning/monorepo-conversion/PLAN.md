# Floatt — Monorepo Conversion (Web + Tauri + Vercel CI/CD)

**Status:** in progress
**Started:** 2026-04-21

---

## Problem

floatt is a single-directory Vite + React app with Tauri bolted on. The goal is two distribution surfaces — a website on Vercel and the Tauri desktop app — sharing the same UI and domain code. Current code statically imports `@tauri-apps/plugin-notification` in two places (`reminder.service.ts`, `NotificationProvider.tsx`), which would crash the web bundle at runtime. The monorepo needs to share ~everything except the entry shells, and it needs a clean platform boundary for desktop-only APIs.

## Constraints

- **Package manager:** pnpm (lockfile already present — keep it)
- **Build tool:** Vite for both apps (React 19, Tailwind v4 CSS-first)
- **Storage:** Dexie (IndexedDB) — works in both browser and Tauri webview, no split needed
- **Tauri-only APIs:** `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-opener` — cannot ship in the web bundle
- **Tailwind v4:** CSS-first config (`@theme` / `:root` vars in `globals.css`) — no `tailwind.config.ts` to share. The CSS file itself becomes the shared artifact.
- **Vercel:** root-directory deploys with Turborepo remote cache (native support)
- **Tauri build:** needs Rust toolchain — runs on GitHub Actions, not Vercel

## Approach

Turborepo + pnpm workspaces. One shared package (`packages/app`) holds every piece of UI and logic. Two thin apps (`apps/web`, `apps/desktop`) each own their entry file, `index.html`, `vite.config.ts`, and platform adapter. `packages/config` holds the shared `tsconfig.base.json` and Tailwind v4 CSS token file.

Desktop-only APIs (notifications, opener) are pulled behind a **platform adapter** — `packages/app` defines a `Platform` interface and reads it via React context. Each app injects its own implementation at boot. The web app gets a browser-Notification-API adapter; desktop gets the Tauri one. The shared code never imports `@tauri-apps/*` directly, so nothing desktop-only leaks into the web bundle.

Rejected: runtime `isTauri()` checks inside shared code. They defeat tree-shaking — `@tauri-apps/plugin-notification` would still end up in the web bundle. Platform adapter is cleaner.

## Target structure

```
floatt/
├── apps/
│   ├── web/                    ← deploys to Vercel (Vite SPA)
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx        ← injects Web platform adapter
│   │   │   └── platform.web.ts ← Notification API impl
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── desktop/                ← Tauri build
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx        ← injects Tauri platform adapter
│       │   └── platform.desktop.ts ← @tauri-apps/plugin-notification impl
│       ├── src-tauri/          ← moved here, tauri.conf.json points to ../dist
│       ├── vite.config.ts      ← Tauri-tuned (port 1420, HMR)
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── app/                    ← all shared UI + logic
│   │   ├── src/
│   │   │   ├── components/     hooks/ screens/ stores/
│   │   │   ├── services/       ← reminder.service uses Platform ctx
│   │   │   ├── queries/ schemas/ types/ utils/ consts/
│   │   │   ├── providers/      ← Theme, Notification, Platform
│   │   │   ├── platform/       ← Platform interface + context
│   │   │   ├── styles/globals.css ← single source of theme vars
│   │   │   └── App.tsx
│   │   ├── package.json        ← exports "./app", "./styles"
│   │   └── tsconfig.json
│   └── config/
│       ├── tsconfig/{base,react}.json
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                ← workspace root, scripts call turbo
├── .github/workflows/
│   ├── ci.yml                  ← lint + typecheck + test on PR
│   └── desktop.yml             ← tauri-action build on tag push
└── vercel.json                 ← root dir apps/web, turbo-ignore
```

## Risks & edge cases

- **Tailwind v4 content detection** — app package not in `apps/web/src`. Add `@source "../../packages/app/src"` to each app's `globals.css` or rely on v4 auto-detection via import graph.
- **HMR across packages** — Vite needs `optimizeDeps.exclude: ["@floatt/app"]` so it doesn't pre-bundle the workspace package.
- **Notification permission states** differ between Web API and Tauri plugin — adapter must normalize: `"granted" | "denied" | "default"`.
- **Tauri paths after move** — `frontendDist: "../dist"` stays correct (dist lives inside `apps/desktop/`). Commands run from `apps/desktop/`.
- **Vitest** — currently at root. Each package gets its own vitest config or root uses project mode. `repeat.test.ts` moves with `utils/` into the app package.
- **Vercel ignored-build-step** — use `turbo-ignore` in `vercel.json` so desktop-only changes don't trigger web builds.

## Open questions

1. **Web notification fallback** — toast when permission denied, or silently skip? (Leaning toast.)
2. **Turbo remote cache** — connect to Vercel now, or defer until the repo has more packages?
3. **Commit cadence** — one commit per phase vs one mega-commit? (Leaning per-phase.)

---

## Phase Index

| #  | Phase | Status |
| -- | ----- | ------ |
| 1  | [Workspace scaffolding](phases/phase-01-workspace-scaffolding.md) | done |
| 2  | [Shared tsconfig](phases/phase-02-shared-tsconfig.md) | done |
| 3  | [Platform adapter](phases/phase-03-platform-adapter.md) | done |
| 4  | [Move shared code](phases/phase-04-move-shared-code.md) | done |
| 5  | [Build web app](phases/phase-05-build-web-app.md) | planned |
| 6  | [Build desktop app](phases/phase-06-build-desktop-app.md) | planned |
| 7  | [Turbo pipeline](phases/phase-07-turbo-pipeline.md) | planned |
| 8  | [Vercel config](phases/phase-08-vercel-config.md) | planned |
| 9  | [GitHub Actions for Tauri](phases/phase-09-github-actions-tauri.md) | planned |
| 10 | [Verification](phases/phase-10-verification.md) | planned |
