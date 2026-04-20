import { useEffect } from "react";
import { liveQuery } from "dexie";
import { usePlatform } from "@floatt/app/providers";
import { getTasksWithReminders } from "@/lib/queries";
import { rescheduleAll } from "@/lib/services/reminder.service";

export function useReminders(): void {
  const { notifications } = usePlatform();

  useEffect(() => {
    let cancelled = false;

    void rescheduleAll(notifications);

    const subscription = liveQuery(() => getTasksWithReminders()).subscribe({
      next: () => {
        if (!cancelled) void rescheduleAll(notifications);
      },
      error: () => {
      },
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [notifications]);
}
