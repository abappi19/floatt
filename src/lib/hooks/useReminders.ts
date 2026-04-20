import { useEffect } from "react";
import { liveQuery } from "dexie";
import { getTasksWithReminders } from "@/lib/queries";
import { rescheduleAll } from "@/lib/services/reminder.service";

export function useReminders(): void {
  useEffect(() => {
    let cancelled = false;

    void rescheduleAll();

    const subscription = liveQuery(() => getTasksWithReminders()).subscribe({
      next: () => {
        if (!cancelled) void rescheduleAll();
      },
      error: () => {
      },
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
}
