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

export interface Platform {
  notifications: PlatformNotifications;
  opener: PlatformOpener;
}
