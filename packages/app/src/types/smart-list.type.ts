export type SmartListId = "my-day" | "important" | "planned" | "tasks";

export type ListSelection =
  | { kind: "smart"; id: SmartListId }
  | { kind: "subgroup"; id: string };
