import {
  cancel as tauriCancel,
  isPermissionGranted,
  requestPermission as tauriRequestPermission,
  Schedule,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Menu,
  type IconMenuItemOptions,
  type MenuItemOptions,
  type PredefinedMenuItemOptions,
  type SubmenuOptions,
} from "@tauri-apps/api/menu";
import { Image } from "@tauri-apps/api/image";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import type {
  PermissionState,
  Platform,
  PlatformMenuItem,
} from "@floatt/app/platform";
import { hashToInt32 } from "@floatt/app/utils";

type NativeMenuItemOptions =
  | MenuItemOptions
  | IconMenuItemOptions
  | SubmenuOptions
  | PredefinedMenuItemOptions;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("icon decode failed"));
    img.src = src;
  });
}

/**
 * Rasterize a lucide SVG into a native menu image. lucide draws with
 * `currentColor`, which resolves to black in a standalone SVG, so we inject the
 * app's foreground color to keep icons legible against the current OS theme.
 *
 * We hand Tauri raw RGBA via `Image.new` (rather than `Image.fromBytes`, which
 * would require the `image-png` Cargo feature to decode).
 */
async function svgToNativeImage(svg: string): Promise<Image | undefined> {
  try {
    const color = getComputedStyle(document.body).color || "#000";
    const colored = svg.replace(/currentColor/g, color);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colored)}`;
    const el = await loadImageElement(url);
    const size = 32; // 16pt @2x for crisp icons on retina displays
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(el, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    return await Image.new(new Uint8Array(data.buffer), size, size);
  } catch {
    return undefined;
  }
}

async function toNativeMenuItem(
  item: PlatformMenuItem,
): Promise<NativeMenuItemOptions> {
  if (item.kind === "separator") return { item: "Separator" };
  if (item.kind === "submenu") {
    return {
      text: item.label,
      enabled: item.disabled !== true,
      items: await Promise.all(item.items.map(toNativeMenuItem)),
    };
  }
  return {
    text: item.label,
    enabled: item.disabled !== true,
    icon: item.icon ? await svgToNativeImage(item.icon) : undefined,
    action: () => item.onSelect(),
  };
}

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
  menu: {
    presentation: "native",
    async popup(items, at) {
      const menu = await Menu.new({
        items: await Promise.all(items.map(toNativeMenuItem)),
      });
      await menu.popup(at ? new LogicalPosition(at.x, at.y) : undefined);
    },
  },
};
