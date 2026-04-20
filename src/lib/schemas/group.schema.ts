import { z } from "zod";

export const groupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number(),
  isCollapsed: z.boolean(),
  createdAt: z.string(),
});

export const groupCreateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export const groupRenameFormSchema = groupCreateFormSchema;

export type GroupCreateForm = z.infer<typeof groupCreateFormSchema>;
export type GroupRenameForm = z.infer<typeof groupRenameFormSchema>;
