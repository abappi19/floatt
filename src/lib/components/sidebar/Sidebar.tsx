import { useEffect, useMemo, useState } from "react";
import { useCommandStore } from "@/lib/stores";
import { Plus, FolderPlus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/lib/components/ui/button";
import { Separator } from "@/lib/components/ui/separator";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { APP_NAME } from "@/lib/consts";
import { useGroups, useSubgroups } from "@/lib/hooks";
import {
  moveSubgroupToGroup,
  reorderGroups,
  reorderSubgroups,
} from "@/lib/services";
import { cn } from "@/lib/utils/cn";
import { SearchBar } from "@/lib/components/search/SearchBar";
import { ThemeToggle } from "@/lib/components/theme/ThemeToggle";
import { SmartListSection } from "./SmartListSection";
import { GroupItem } from "./GroupItem";
import { SubgroupItem } from "./SubgroupItem";
import { NewListDialog } from "./NewListDialog";
import { NewGroupDialog } from "./NewGroupDialog";

type DragKind = "group" | "subgroup" | null;

function RootDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "sidebar-root-dropzone",
    data: { type: "root-dropzone" },
  });
  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mx-2 mt-1 flex h-9 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground transition-colors",
        isOver
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border/60",
      )}
    >
      Drop here to ungroup
    </div>
  );
}

export function Sidebar() {
  const groups = useGroups();
  const subgroups = useSubgroups();
  const [newListOpen, setNewListOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  const openNewListNonce = useCommandStore((s) => s.openNewListNonce);
  useEffect(() => {
    if (openNewListNonce === 0) return;
    setNewListOpen(true);
  }, [openNewListNonce]);
  const [dragKind, setDragKind] = useState<DragKind>(null);

  const standaloneSubgroups = useMemo(
    () => subgroups.filter((s) => s.groupId === null),
    [subgroups],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    setDragKind(type === "group" || type === "subgroup" ? type : null);
  };

  const handleDragCancel = () => setDragKind(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setDragKind(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    if (activeType === "group") {
      if (overType !== "group" || active.id === over.id) return;
      const ids = groups.map((g) => g.id);
      const from = ids.indexOf(active.id as string);
      const to = ids.indexOf(over.id as string);
      if (from < 0 || to < 0 || from === to) return;
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, active.id as string);
      void reorderGroups(next);
      return;
    }

    if (activeType !== "subgroup") return;

    const activeSub = subgroups.find((s) => s.id === active.id);
    if (!activeSub) return;
    const activeGroupId = activeSub.groupId;

    let targetGroupId: string | null;
    let targetIndex: number;

    if (overType === "subgroup") {
      const overSub = subgroups.find((s) => s.id === over.id);
      if (!overSub) return;
      targetGroupId = overSub.groupId;
      const siblings = subgroups
        .filter((s) => s.groupId === targetGroupId && s.id !== active.id)
        .map((s) => s.id);
      targetIndex = siblings.indexOf(over.id as string);
      if (targetIndex < 0) targetIndex = siblings.length;
    } else if (overType === "group") {
      // Drop subgroup onto a group header → place at end of that group
      targetGroupId = over.id as string;
      const siblings = subgroups
        .filter((s) => s.groupId === targetGroupId && s.id !== active.id)
        .map((s) => s.id);
      targetIndex = siblings.length;
    } else if (overType === "root-dropzone") {
      targetGroupId = null;
      const siblings = subgroups
        .filter((s) => s.groupId === null && s.id !== active.id)
        .map((s) => s.id);
      targetIndex = siblings.length;
    } else {
      return;
    }

    const siblingsInTarget = subgroups
      .filter((s) => s.groupId === targetGroupId && s.id !== active.id)
      .map((s) => s.id);
    const newOrder = [...siblingsInTarget];
    newOrder.splice(targetIndex, 0, active.id as string);

    if (activeGroupId === targetGroupId) {
      const current = subgroups
        .filter((s) => s.groupId === targetGroupId)
        .map((s) => s.id)
        .join(",");
      if (current === newOrder.join(",")) return;
      void reorderSubgroups(newOrder);
    } else {
      void moveSubgroupToGroup(active.id as string, targetGroupId, newOrder);
    }
  };

  const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);
  const standaloneIds = useMemo(
    () => standaloneSubgroups.map((s) => s.id),
    [standaloneSubgroups],
  );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <span className="font-semibold">{APP_NAME}</span>
      </div>

      <div className="border-b p-3">
        <SearchBar />
      </div>

      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-col gap-3 py-3">
            <SmartListSection />

            <Separator className="mx-2" />

            <div className="flex flex-col gap-1 px-2">
              <SortableContext
                items={groupIds}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((g) => (
                  <GroupItem key={g.id} group={g} allGroups={groups} />
                ))}
              </SortableContext>

              <SortableContext
                items={standaloneIds}
                strategy={verticalListSortingStrategy}
              >
                {standaloneSubgroups.length > 0 ? (
                  <ul className="flex flex-col gap-0.5">
                    {standaloneSubgroups.map((s) => (
                      <li key={s.id}>
                        <SubgroupItem subgroup={s} groups={groups} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <RootDropZone active={dragKind === "subgroup"} />
              </SortableContext>

              {groups.length === 0 && standaloneSubgroups.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground/80">
                  Create a list to organize your tasks.
                </p>
              ) : null}
            </div>
          </div>
        </DndContext>
      </ScrollArea>

      <div className="flex items-center gap-1 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start"
          onClick={() => setNewListOpen(true)}
        >
          <Plus />
          New list
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setNewGroupOpen(true)}
          aria-label="New group"
        >
          <FolderPlus />
        </Button>
        <ThemeToggle />
      </div>

      <NewListDialog open={newListOpen} onOpenChange={setNewListOpen} />
      <NewGroupDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
    </aside>
  );
}
