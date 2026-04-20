import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

type NotificationPermission = "granted" | "denied" | "unknown";

type NotificationContextValue = {
  permission: NotificationPermission;
  request: () => Promise<NotificationPermission>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

async function resolvePermission(): Promise<NotificationPermission> {
  try {
    const granted = await isPermissionGranted();
    if (granted) return "granted";
    const result = await requestPermission();
    return result === "granted" ? "granted" : "denied";
  } catch {
    return "unknown";
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] =
    useState<NotificationPermission>("unknown");

  useEffect(() => {
    let cancelled = false;
    resolvePermission().then((result) => {
      if (!cancelled) setPermission(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value: NotificationContextValue = {
    permission,
    request: async () => {
      const result = await resolvePermission();
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
