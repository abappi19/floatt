import { CalendarClock, Flame, LayoutList, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SmartListId } from "@/types";

export interface SmartListDef {
  id: SmartListId;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export const SMART_LISTS: readonly SmartListDef[] = [
  { id: "my-day",    label: "My Day",    icon: Flame,         iconColor: "text-amber-500",  iconBg: "bg-amber-500/15"  },
  { id: "important", label: "Important", icon: Star,          iconColor: "text-rose-500",   iconBg: "bg-rose-500/15"   },
  { id: "planned",   label: "Planned",   icon: CalendarClock, iconColor: "text-sky-500",    iconBg: "bg-sky-500/15"    },
  { id: "tasks",     label: "Tasks",     icon: LayoutList,    iconColor: "text-violet-500", iconBg: "bg-violet-500/15" },
] as const;

export const SMART_LIST_IDS = SMART_LISTS.map((l) => l.id);
