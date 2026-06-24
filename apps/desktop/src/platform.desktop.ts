import {
  cancel as tauriCancel,
  isPermissionGranted,
  requestPermission as tauriRequestPermission,
  Schedule,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { PermissionState, Platform } from "@floatt/app/platform";
import { hashToInt32 } from "@floatt/app/utils";

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

function normalizePermission(value: string): PermissionState {
  if (value === "granted") return "granted";
  if (value === "denied") return "denied";
  return "default";
}

export const desktopPlatform: Platform = {
  notifications: {
    async isAvailable() {
      try {
        return await isPermissionGranted();
      } catch {
        return false;
      }
    },
    async requestPermission() {
      try {
        const result = await tauriRequestPermission();
        return normalizePermission(result);
      } catch {
        return "default";
      }
    },
    async send({ title, body, icon }) {
      sendNotification({ title, body, icon });
    },
    async schedule({ id, title, body, at }) {
      sendNotification({
        id: hashToInt32(id),
        title,
        body,
        schedule: Schedule.at(at, false, true),
      });
    },
    async cancel(id) {
      try {
        await tauriCancel([hashToInt32(id)]);
      } catch {
      }
    },
  },
  opener: {
    async openUrl(url) {
      await tauriOpenUrl(url);
    },
  },
  window: {
    controls: isMac ? "native" : "custom",
    insets: isMac
      ? { top: 28, left: 72, right: 0 } // traffic-light zone height + left clearance
      : { top: 32, left: 0, right: 138 }, // controls strip height + right clearance
    async minimize() {
      await getCurrentWindow().minimize();
    },
    async toggleMaximize() {
      await getCurrentWindow().toggleMaximize();
    },
    async close() {
      await getCurrentWindow().close();
    },
  },
};
