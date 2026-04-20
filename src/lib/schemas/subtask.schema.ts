import { z } from "zod";

export const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  isCompleted: z.boolean(),
  notes: z.string(),
  taskId: z.string().min(1),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const subtaskCreateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  taskId: z.string().min(1),
});

export const subtaskRenameFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
});

export const subtaskNotesFormSchema = z.object({
  notes: z.string().max(10_000),
});

export type SubtaskCreateForm = z.infer<typeof subtaskCreateFormSchema>;
export type SubtaskRenameForm = z.infer<typeof subtaskRenameFormSchema>;
export type SubtaskNotesForm = z.infer<typeof subtaskNotesFormSchema>;
