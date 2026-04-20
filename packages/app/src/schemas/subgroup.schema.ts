import { z } from "zod";

export const subgroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  groupId: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
});

export const subgroupCreateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  groupId: z.string().nullable().optional(),
});

export const subgroupRenameFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export type SubgroupCreateForm = z.infer<typeof subgroupCreateFormSchema>;
export type SubgroupRenameForm = z.infer<typeof subgroupRenameFormSchema>;
