import { useEffect, useMemo, useRef, useState } from "react";
import {
  Folder,
  FolderInput,
  FolderMinus,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import type { Group, Subgroup } from "@/types";
import { cn } from "@/utils/cn.util";
import { toTransform } from "@/utils/dnd.util";
import { useTasks, useSelectList, useSelectedList } from "@/hooks";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog.ui";
import {
  deleteSubgroup,
  moveSubgroup,
  renameSubgroup,
} from "@/services";
import {
  SidebarItemContextMenu,
  SidebarItemMenu,
  type SidebarMenuAction,
} from "./sidebar-item-menu.component";
import { SUBGROUP_INDENT_PX, TREE_BASE_PADDING_PX } from "./tree.util";

interface SubgroupItemProps {
  subgroup: Subgroup;
  groups: Group[];
  /** Tree depth (0 = standalone, 1 = inside a group); drives indentation. */
  depth?: number;
}

export function SubgroupItem({
  subgroup,
  groups,
  depth = 0,
}: SubgroupItemProps) {
  const selected = useSelectedList();
  const selectList = useSelectList();
  const tasks = useTasks(subgroup.id);
  const pendingCount = useMemo(
    () => tasks.filter((t) => t.isCompleted === 0).length,
    [tasks],
  );

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(subgroup.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subgroup.id,
    data: { type: "subgroup" },
    disabled: isRenaming,
  });

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const isActive =
    selected.kind === "subgroup" && selected.id === subgroup.id;

  const startRename = () => {
    setDraftName(subgroup.name);
    setIsRenaming(true);
  };

  const commitRename = async () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== subgroup.name) {
      await renameSubgroup(subgroup.id, trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setDraftName(subgroup.name);
    setIsRenaming(false);
  };

  const handleSelect = () => {
    if (isRenaming) return;
    selectList({ kind: "subgroup", id: subgroup.id });
  };

  const style: React.CSSProperties = {
    transform: toTransform(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    paddingLeft: TREE_BASE_PADDING_PX + depth * SUBGROUP_INDENT_PX,
  };

  const actions: SidebarMenuAction[] = [
    { kind: "item", label: "Rename", icon: Pencil, onSelect: startRename },
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
        ...(groups.length > 0
          ? [{ kind: "separator" as const }]
          : []),
        ...groups.map<SidebarMenuAction>((g) => ({
          kind: "item",
          label: g.name,
          icon: Folder,
          disabled: g.id === subgroup.groupId,
          onSelect: () => moveSubgroup(subgroup.id, g.id),
        })),
      ],
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Delete list",
      icon: Trash2,
      variant: "destructive",
      onSelect: () => setConfirmDelete(true),
    },
  ];

  return (
    <>
      <SidebarItemContextMenu actions={actions} disabled={isRenaming}>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={cn(
            "group relative flex w-full items-center gap-2 rounded-md text-sm transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "hover:bg-sidebar-accent/60",
          )}
        >
          <button
            type="button"
            onClick={handleSelect}
            className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none"
          >
            <ListTodo className="size-4 shrink-0" />
            {isRenaming ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelRename();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 rounded-sm border border-input bg-background px-1 py-0.5 text-sm outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{subgroup.name}</span>
            )}
            {!isRenaming && pendingCount > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {pendingCount}
              </span>
            ) : null}
          </button>
          {!isRenaming ? (
            <SidebarItemMenu
              actions={actions}
              label={`${subgroup.name} options`}
            />
          ) : null}
        </div>
      </SidebarItemContextMenu>
      <ConfirmDestructiveDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${subgroup.name}"?`}
        description="This permanently deletes the list and all its tasks."
        onConfirm={() => deleteSubgroup(subgroup.id)}
      />
    </>
  );
}
