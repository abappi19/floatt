import { Calendar, ListTodo, Star, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SmartListId } from "@/lib/types";

export interface SmartListDef {
  id: SmartListId;
  label: string;
  icon: LucideIcon;
}

export const SMART_LISTS: readonly SmartListDef[] = [
  { id: "my-day", label: "My Day", icon: Sun },
  { id: "important", label: "Important", icon: Star },
  { id: "planned", label: "Planned", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: ListTodo },
] as const;

export const SMART_LIST_IDS = SMART_LISTS.map((l) => l.id);
