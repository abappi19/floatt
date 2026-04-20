import { z } from "zod";
import { repeatSchema } from "./repeat.schema";

const bitSchema = z.union([z.literal(0), z.literal(1)]);

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  isCompleted: bitSchema,
  completedAt: z.string().optional(),
  notes: z.string(),
  subgroupId: z.string().min(1),
  sortOrder: z.number(),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
  repeat: repeatSchema.nullable().optional(),
  isImportant: bitSchema,
  addedToMyDayAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskCreateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  subgroupId: z.string().min(1),
});

export const taskRenameFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
});

export const taskNotesFormSchema = z.object({
  notes: z.string().max(10_000),
});

export type TaskCreateForm = z.infer<typeof taskCreateFormSchema>;
export type TaskRenameForm = z.infer<typeof taskRenameFormSchema>;
export type TaskNotesForm = z.infer<typeof taskNotesFormSchema>;
