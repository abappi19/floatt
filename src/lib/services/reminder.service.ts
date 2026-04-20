import {
  cancel as tauriCancel,
  isPermissionGranted,
  Schedule,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { getTasksWithReminders } from "@/lib/queries";
import { toast } from "@/lib/stores/toast.store";
import type { Task } from "@/lib/types";
import { hashToInt32 } from "@/lib/utils/hash";

type Mode = "native" | "fallback" | "disabled";

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const scheduledNativeIds = new Map<string, number>();
let activeMode: Mode = "disabled";

function notificationIdFor(taskId: string): number {
  return hashToInt32(taskId);
}

function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

async function detectMode(): Promise<Mode> {
  try {
    const granted = await isPermissionGranted();
    return granted ? "native" : "fallback";
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

function scheduleNative(task: Task): void {
  if (!task.reminderAt || !isFuture(task.reminderAt)) return;
  const id = notificationIdFor(task.id);
  try {
    sendNotification({
      id,
      title: "Reminder",
      body: task.title,
      schedule: Schedule.at(new Date(task.reminderAt), false, true),
    });
    scheduledNativeIds.set(task.id, id);
  } catch {
    scheduleFallback(task);
  }
}

async function cancelNative(taskId: string): Promise<void> {
  const id = scheduledNativeIds.get(taskId) ?? notificationIdFor(taskId);
  try {
    await tauriCancel([id]);
  } catch {
  }
  scheduledNativeIds.delete(taskId);
}

async function clearAll(): Promise<void> {
  for (const taskId of timers.keys()) clearFallbackTimer(taskId);
  if (scheduledNativeIds.size > 0) {
    const ids = Array.from(scheduledNativeIds.values());
    try {
      await tauriCancel(ids);
    } catch {
    }
    scheduledNativeIds.clear();
  }
}

export async function scheduleAll(): Promise<void> {
  activeMode = await detectMode();
  if (activeMode === "disabled") return;
  const tasks = await getTasksWithReminders();
  for (const task of tasks) {
    if (activeMode === "native") scheduleNative(task);
    else scheduleFallback(task);
  }
}

export async function schedule(task: Task): Promise<void> {
  if (activeMode === "disabled") activeMode = await detectMode();
  if (activeMode === "native") scheduleNative(task);
  else scheduleFallback(task);
}

export async function cancelReminder(taskId: string): Promise<void> {
  clearFallbackTimer(taskId);
  await cancelNative(taskId);
}

export async function rescheduleAll(): Promise<void> {
  await clearAll();
  await scheduleAll();
}
