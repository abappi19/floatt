import { useEffect, useMemo, useRef, useState } from "react";
import { ListTodo } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import type { Group, Subgroup } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { useTasks, useSelectList, useSelectedList } from "@/lib/hooks";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { ConfirmDestructiveDialog } from "@/lib/components/ui/confirm-destructive-dialog";
import {
  deleteSubgroup,
  moveSubgroup,
  renameSubgroup,
} from "@/lib/services";
import { SidebarContextMenu } from "./SidebarContextMenu";

interface SubgroupItemProps {
  subgroup: Subgroup;
  groups: Group[];
  indent?: boolean;
}

function toTransform(
  t: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!t) return undefined;
  return `translate3d(${t.x}px, ${t.y}px, 0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}

export function SubgroupItem({ subgroup, groups, indent }: SubgroupItemProps) {
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
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group relative flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
          indent && "pl-7",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "hover:bg-sidebar-accent/60",
        )}
      >
        <button
          type="button"
          onClick={handleSelect}
          className="flex flex-1 items-center gap-3 text-left outline-none"
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
            <span className="flex-1 truncate">{subgroup.name}</span>
          )}
          {!isRenaming && pendingCount > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {pendingCount}
            </span>
          ) : null}
        </button>
        {!isRenaming ? (
          <SidebarContextMenu label={`${subgroup.name} options`}>
            <DropdownMenuItem onSelect={startRename}>Rename</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to group</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={() => moveSubgroup(subgroup.id, null)}
                  disabled={subgroup.groupId === null}
                >
                  No group
                </DropdownMenuItem>
                {groups.length > 0 ? <DropdownMenuSeparator /> : null}
                {groups.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onSelect={() => moveSubgroup(subgroup.id, g.id)}
                    disabled={g.id === subgroup.groupId}
                  >
                    {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmDelete(true)}
            >
              Delete list
            </DropdownMenuItem>
          </SidebarContextMenu>
        ) : null}
      </div>
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
