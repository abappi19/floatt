# Phase 3 — Platform Adapter

**Status:** done

## Goal

Establish the platform boundary before any code moves. Define a `Platform` interface and React context in `packages/app` — shared code never imports `@tauri-apps/*` again.

## Scope

- `packages/app/src/platform/platform.types.ts` — interface:
  ```ts
  interface PlatformNotifications {
    isAvailable(): Promise<boolean>;
    requestPermission(): Promise<"granted" | "denied" | "default">;
    send(opts: { title: string; body?: string; icon?: string }): Promise<void>;
    schedule(opts: { id: string; title: string; body?: string; at: Date }): Promise<void>;
    cancel(id: string): Promise<void>;
  }
  interface PlatformOpener {
    openUrl(url: string): Promise<void>;
  }
  interface Platform {
    notifications: PlatformNotifications;
    opener: PlatformOpener;
  }
  ```
- `packages/app/src/providers/PlatformProvider.tsx` — React context + `usePlatform()` hook. Throws if used outside a provider.
- Refactor in place (still at `src/` for now — we'll move in Phase 4):
  - `src/app/providers/NotificationProvider.tsx` uses `usePlatform().notifications` instead of `@tauri-apps/plugin-notification`.
  - `src/lib/services/reminder.service.ts` — accepts a `PlatformNotifications` instance as a function argument (services can't use hooks). Callers pass `usePlatform().notifications` through from the hook layer.
- Temporary: create `src/platform/platform.desktop.ts` that wraps the Tauri plugin to satisfy the current runtime. Web adapter comes in Phase 5.

## Deliverables

- `packages/app/src/platform/platform.types.ts`
- `packages/app/src/providers/PlatformProvider.tsx`
- Refactored `NotificationProvider.tsx`, `reminder.service.ts`
- Temporary `src/platform/platform.desktop.ts` (moves to `apps/desktop/src/` in Phase 6)

## Verification

- `pnpm tauri dev` still runs, reminders still fire (desktop adapter in place).
- Grep confirms `@tauri-apps/plugin-notification` is imported only in the desktop adapter — not in providers or services.
- `pnpm build` passes.

## Notes

- This is the critical architectural moment. Done right, Phase 4's code move becomes mechanical.
- `opener` interface mirrors `@tauri-apps/plugin-opener` — web adapter uses `window.open(url, "_blank", "noopener")`.
