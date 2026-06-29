import { useEffect, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Clock,
  Flame,
  Folder,
  FolderInput,
  FolderMinus,
  GripVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SidebarMenuAction } from "@/components/sidebar/sidebar-item-menu.component";
import { deleteSubgroup, moveSubgroup, renameSubgroup } from "@/services";
import type { TaskSort } from "@/stores/ui.store";
import type { ListSelection } from "@/types";
import { useGroups } from "./use-groups";
import { useSubgroups } from "./use-subgroups";
import { useSelectList, useSetTaskSort, useTaskSort } from "./use-ui-store";

const SORT_OPTIONS: { value: TaskSort; label: string; icon: LucideIcon }[] = [
  { value: "manual", label: "Manual", icon: GripVertical },
  { value: "importance", label: "Important", icon: Star },
  { value: "alpha", label: "Alphabetically", icon: ArrowDownAZ },
  { value: "due", label: "Due date", icon: Calendar },
  { value: "created", label: "Creation date", icon: Clock },
  { value: "myday", label: "Added to My Day", icon: Flame },
];

export function useListOptions(selection: ListSelection) {
  const sort = useTaskSort();
  const setSort = useSetTaskSort();
  const subgroups = useSubgroups();
  const groups = useGroups();
  const selectList = useSelectList();

  const subgroup =
    selection.kind === "subgroup"
      ? subgroups.find((s) => s.id === selection.id)
      : undefined;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const selectionKey = selection.id;
  useEffect(() => {
    setIsRenaming(false);
  }, [selection.kind, selectionKey]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    if (!subgroup) return;
    setDraftName(subgroup.name);
    setIsRenaming(true);
  };

  const commitRename = async () => {
    if (!subgroup) {
      setIsRenaming(false);
      return;
    }
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== subgroup.name) {
      await renameSubgroup(subgroup.id, trimmed);
    }
    setIsRenaming(false);
  };

  const sortAction: SidebarMenuAction = {
    kind: "submenu",
    label: "Sort",
    icon: ArrowUpDown,
    items: SORT_OPTIONS.map((o) => ({
      kind: "item",
      label: (sort === o.value ? "✓ " : "") + o.label,
      icon: o.icon,
      onSelect: () => setSort(o.value),
    })),
  };

  const actions: SidebarMenuAction[] = subgroup
    ? [
      { kind: "item", label: "Rename list", icon: Pencil, onSelect: startRename },
      {
        kind: "submenu",
        label: "Move to group",
        icon: FolderInput,
        items: [
          {
            kind: "item",
            label: "No group",
            icon: FolderMinus,
            disabled: subgroup.groupId === null,
            onSelect: () => moveSubgroup(subgroup.id, null),
          },
          ...(groups.length > 0 ? [{ kind: "separator" as const }] : []),
          ...groups.map<SidebarMenuAction>((g) => ({
            kind: "item",
            label: g.name,
            icon: Folder,
            disabled: g.id === subgroup.groupId,
            onSelect: () => moveSubgroup(subgroup.id, g.id),
          })),
        ],
      },
      sortAction,
      { kind: "separator" },
      {
        kind: "item",
        label: "Delete list",
        icon: Trash2,
        variant: "destructive",
        onSelect: () => setConfirmDelete(true),
      },
    ]
    : [sortAction];

  return {
    subgroup,
    actions,
    isRenaming,
    draftName,
    setDraftName,
    renameInputRef,
    commitRename,
    cancelRename: () => setIsRenaming(false),
    confirmDelete,
    setConfirmDelete,
    deleteList: () => {
      if (!subgroup) return;
      deleteSubgroup(subgroup.id);
      selectList({ kind: "smart", id: "my-day" });
    },
  };
}
