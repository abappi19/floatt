import type { Repeat } from "./repeat.type";

export type Bit = 0 | 1;

export interface Task {
  id: string;
  title: string;
  isCompleted: Bit;
  completedAt?: string;
  notes: string;
  subgroupId: string;
  sortOrder: number;
  dueDate?: string;
  reminderAt?: string;
  repeat?: Repeat | null;
  isImportant: Bit;
  addedToMyDayAt?: string;
  createdAt: string;
  updatedAt: string;
}
