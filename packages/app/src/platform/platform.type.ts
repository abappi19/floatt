export type PermissionState = "granted" | "denied" | "default";

export interface PlatformNotifications {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<PermissionState>;
  send(opts: { title: string; body?: string; icon?: string }): Promise<void>;
  schedule(opts: {
    id: string;
    title: string;
    body?: string;
    at: Date;
  }): Promise<void>;
  cancel(id: string): Promise<void>;
}

export interface PlatformOpener {
  openUrl(url: string): Promise<void>;
}

export type WindowControls = "native" | "custom" | "none";

export interface WindowInsets {
  top: number;
  left: number;
  right: number;
}

export interface PlatformWindow {
  /** native = OS controls overlay the bar (macOS); custom = we render buttons (Windows); none = web */
  controls: WindowControls;
  /** px the app should keep clear of OS chrome — apply where you need it (SafeArea-style) */
  insets: WindowInsets;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
}

/** How list/context menus should be rendered on this platform. */
export type MenuPresentation = "dom" | "native";

export type PlatformMenuItem =
  | { kind: "item"; label: string; onSelect: () => void; disabled?: boolean }
  | { kind: "separator" }
  | {
      kind: "submenu";
      label: string;
      items: PlatformMenuItem[];
      disabled?: boolean;
    };

export interface PlatformMenu {
  /** "dom" = render the in-app Radix menu; "native" = pop a real OS menu via popup(). */
  presentation: MenuPresentation;
  /** Show a native menu at a window-relative point. No-op when presentation is "dom". */
  popup(items: PlatformMenuItem[], at?: { x: number; y: number }): Promise<void>;
}

export interface Platform {
  notifications: PlatformNotifications;
  opener: PlatformOpener;
  window: PlatformWindow;
  menu: PlatformMenu;
}
