import type { PlatformNotifications } from "@floatt/app/platform";
import { getTasksWithReminders } from "@/queries";
import { toast } from "@/stores/toast.store";
import type { Task } from "@/types";

type Mode = "native" | "fallback" | "disabled";

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const scheduledNativeIds = new Set<string>();
let activeMode: Mode = "disabled";

function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

async function detectMode(
  notifications: PlatformNotifications,
): Promise<Mode> {
  try {
    const available = await notifications.isAvailable();
    return available ? "native" : "fallback";
  } catch {
    return "fallback";
  }
}

function clearFallbackTimer(taskId: string): void {
  const handle = timers.get(taskId);
  if (handle !== undefined) {
    clearTimeout(handle);
    timers.delete(taskId);
  }
}

function scheduleFallback(task: Task): void {
  if (!task.reminderAt || !isFuture(task.reminderAt)) return;
  clearFallbackTimer(task.id);
  const delay = new Date(task.reminderAt).getTime() - Date.now();
  const handle = setTimeout(() => {
    toast({ title: "Reminder", body: task.title });
    timers.delete(task.id);
  }, delay);
  timers.set(task.id, handle);
}

async function scheduleNative(
  notifications: PlatformNotifications,
  task: Task,
): Promise<void> {
  if (!task.reminderAt || !isFuture(task.reminderAt)) return;
  try {
    await notifications.schedule({
      id: task.id,
      title: "Reminder",
      body: task.title,
      at: new Date(task.reminderAt),
    });
    scheduledNativeIds.add(task.id);
  } catch {
    scheduleFallback(task);
  }
}

async function cancelNative(
  notifications: PlatformNotifications,
  taskId: string,
): Promise<void> {
  try {
    await notifications.cancel(taskId);
  } catch {
  }
  scheduledNativeIds.delete(taskId);
}

async function clearAll(notifications: PlatformNotifications): Promise<void> {
  for (const taskId of timers.keys()) clearFallbackTimer(taskId);
  if (scheduledNativeIds.size > 0) {
    const ids = Array.from(scheduledNativeIds);
    for (const id of ids) {
      try {
        await notifications.cancel(id);
      } catch {
      }
    }
    scheduledNativeIds.clear();
  }
}

export async function scheduleAll(
  notifications: PlatformNotifications,
): Promise<void> {
  activeMode = await detectMode(notifications);
  if (activeMode === "disabled") return;
  const tasks = await getTasksWithReminders();
  for (const task of tasks) {
    if (activeMode === "native") await scheduleNative(notifications, task);
    else scheduleFallback(task);
  }
}

export async function schedule(
  notifications: PlatformNotifications,
  task: Task,
): Promise<void> {
  if (activeMode === "disabled") activeMode = await detectMode(notifications);
  if (activeMode === "native") await scheduleNative(notifications, task);
  else scheduleFallback(task);
}

export async function cancelReminder(
  notifications: PlatformNotifications,
  taskId: string,
): Promise<void> {
  clearFallbackTimer(taskId);
  await cancelNative(notifications, taskId);
}

export async function rescheduleAll(
  notifications: PlatformNotifications,
): Promise<void> {
  await clearAll(notifications);
  await scheduleAll(notifications);
}
