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

export interface Platform {
  notifications: PlatformNotifications;
  opener: PlatformOpener;
  window: PlatformWindow;
}
