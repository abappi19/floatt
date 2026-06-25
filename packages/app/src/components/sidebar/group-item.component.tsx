import { useEffect, useRef, useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import type { Group } from "@/types";
import { cn } from "@/utils/cn.util";
import { useSubgroupsByGroup } from "@/hooks";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.ui";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog.ui";
import {
  deleteGroup,
  renameGroup,
  toggleGroupCollapse,
} from "@/services";
import { SidebarContextMenu } from "./sidebar-context-menu.component";

interface GroupItemProps {
  group: Group;
}

function toTransform(
  t: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!t) return undefined;
  return `translate3d(${t.x}px, ${t.y}px, 0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}

export function GroupItem({ group }: GroupItemProps) {
  const subgroups = useSubgroupsByGroup(group.id);

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
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
    id: group.id,
    data: { type: "group" },
    disabled: isRenaming,
  });

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    setDraftName(group.name);
    setIsRenaming(true);
  };

  const commitRename = async () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== group.name) {
      await renameGroup(group.id, trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setDraftName(group.name);
    setIsRenaming(false);
  };

  const toggle = () => {
    if (isRenaming) return;
    toggleGroupCollapse(group.id);
  };

  const style: React.CSSProperties = {
    transform: toTransform(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-md text-sm transition-colors hover:bg-sidebar-accent/60",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
        aria-expanded={!group.isCollapsed}
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            !group.isCollapsed && "rotate-90",
          )}
        />
        <Folder className="size-4 shrink-0" />
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
            className="min-w-0 flex-1 rounded-sm border border-input bg-background px-1 py-0.5 text-sm outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate font-medium">
            {group.name}
          </span>
        )}
        {!isRenaming && subgroups.length > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {subgroups.length}
          </span>
        ) : null}
      </button>
      {!isRenaming ? (
        <SidebarContextMenu label={`${group.name} options`}>
          <DropdownMenuItem onSelect={startRename}>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            Delete group
          </DropdownMenuItem>
        </SidebarContextMenu>
      ) : null}

      <ConfirmDestructiveDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${group.name}"?`}
        description="The group is removed. Lists inside become standalone."
        onConfirm={() => deleteGroup(group.id)}
        confirmLabel="Delete group"
      />
    </div>
  );
}
