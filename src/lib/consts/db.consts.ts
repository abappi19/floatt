export const DB_NAME = "floatt";
export const DB_VERSION = 1;

export const TABLES = {
  groups: "groups",
  subgroups: "subgroups",
  tasks: "tasks",
  subtasks: "subtasks",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
