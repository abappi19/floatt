import { z } from "zod";

export const repeatKindSchema = z.enum([
  "daily",
  "weekdays",
  "weekly",
  "monthly",
  "yearly",
]);

export const repeatSchema = z.object({
  kind: repeatKindSchema,
  interval: z.number().int().positive(),
});
