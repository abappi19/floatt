import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePlatform } from "@floatt/app/providers";
import type { PlatformNotifications } from "@floatt/app/platform";

type NotificationPermission = "granted" | "denied" | "unknown";

type NotificationContextValue = {
  permission: NotificationPermission;
  request: () => Promise<NotificationPermission>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

async function resolvePermission(
  notifications: PlatformNotifications,
): Promise<NotificationPermission> {
  try {
    const available = await notifications.isAvailable();
    if (available) return "granted";
    const result = await notifications.requestPermission();
    return result === "granted" ? "granted" : "denied";
  } catch {
    return "unknown";
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications } = usePlatform();
  const [permission, setPermission] =
    useState<NotificationPermission>("unknown");

  useEffect(() => {
    let cancelled = false;
    resolvePermission(notifications).then((result) => {
      if (!cancelled) setPermission(result);
    });
    return () => {
      cancelled = true;
    };
  }, [notifications]);

  const value: NotificationContextValue = {
    permission,
    request: async () => {
      const result = await resolvePermission(notifications);
      setPermission(result);
      return result;
    },
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationPermission() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationPermission must be used within NotificationProvider",
    );
  return ctx;
}
