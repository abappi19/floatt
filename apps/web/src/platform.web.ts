import type { PermissionState, Platform } from "@floatt/app/platform";

function normalizePermission(value: NotificationPermission): PermissionState {
  if (value === "granted") return "granted";
  if (value === "denied") return "denied";
  return "default";
}

const schedules = new Map<string, ReturnType<typeof setTimeout>>();

function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export const webPlatform: Platform = {
  notifications: {
    async isAvailable() {
      return canNotify() && Notification.permission === "granted";
    },
    async requestPermission() {
      if (!canNotify()) return "denied";
      const result = await Notification.requestPermission();
      return normalizePermission(result);
    },
    async send({ title, body, icon }) {
      if (!canNotify() || Notification.permission !== "granted") return;
      new Notification(title, { body, icon });
    },
    async schedule({ id, title, body, at }) {
      const delay = Math.max(0, at.getTime() - Date.now());
      const existing = schedules.get(id);
      if (existing) clearTimeout(existing);
      const handle = setTimeout(() => {
        if (canNotify() && Notification.permission === "granted") {
          new Notification(title, { body });
        }
        schedules.delete(id);
      }, delay);
      schedules.set(id, handle);
    },
    async cancel(id) {
      const handle = schedules.get(id);
      if (handle) {
        clearTimeout(handle);
        schedules.delete(id);
      }
    },
  },
  opener: {
    async openUrl(url) {
      window.open(url, "_blank", "noopener,noreferrer");
    },
  },
};
