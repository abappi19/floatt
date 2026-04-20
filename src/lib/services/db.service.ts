import Dexie, { type Table } from "dexie";
import { DB_NAME, DB_VERSION, TABLES } from "@/lib/consts";
import type { Group, Subgroup, Subtask, Task } from "@/lib/types";

export class FloattDatabase extends Dexie {
  groups!: Table<Group, string>;
  subgroups!: Table<Subgroup, string>;
  tasks!: Table<Task, string>;
  subtasks!: Table<Subtask, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      [TABLES.groups]: "id, sortOrder",
      [TABLES.subgroups]: "id, groupId, sortOrder, [groupId+sortOrder]",
      [TABLES.tasks]:
        "id, subgroupId, dueDate, isImportant, addedToMyDayAt, reminderAt, [subgroupId+sortOrder], [isCompleted+subgroupId]",
      [TABLES.subtasks]: "id, taskId, [taskId+sortOrder]",
    });
  }
}

export const db = new FloattDatabase();
