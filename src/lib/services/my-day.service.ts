import { todayIsoDate } from "@/lib/utils";
import { db } from "./db.service";

export async function addToMyDay(taskId: string): Promise<void> {
  await db.tasks.update(taskId, {
    addedToMyDayAt: todayIsoDate(),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeFromMyDay(taskId: string): Promise<void> {
  await db.tasks.update(taskId, {
    addedToMyDayAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}
