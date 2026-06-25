import { useEffect, useMemo, useState } from "react";
import { useCommandStore } from "@/stores";
import { Plus, FolderPlus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  type UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_NAME } from "@/consts";
import { useGroups, useSubgroups, useWindowInsets } from "@/hooks";
import { moveSubgroupToGroup, reorderGroups } from "@/services";
import { SearchBar } from "@/components/search/SearchBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SmartListSection } from "./SmartListSection";
import { GroupItem } from "./GroupItem";
import { SubgroupItem } from "./SubgroupItem";
import { NewListDialog } from "./NewListDialog";
import { NewGroupDialog } from "./NewGroupDialog";
import { DragOverlayRow } from "./DragOverlayRow";
import {
  type FlatItem,
  type Projection,
  SUBGROUP_INDENT_PX,
  applyDrop,
  buildFlatTree,
  getProjection,
  removeChildrenOf,
} from "./tree";

const measuring = {
  droppable: { strategy: MeasuringStrategy.Always },
};

export function Sidebar() {
  const groups = useGroups();
  const subgroups = useSubgroups();
  const insets = useWindowInsets();
  const [newListOpen, setNewListOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  const openNewListNonce = useCommandStore((s) => s.openNewListNonce);
  useEffect(() => {
    if (openNewListNonce === 0) return;
    setNewListOpen(true);
  }, [openNewListNonce]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const flatItems = useMemo(
    () => buildFlatTree(groups, subgroups),
    [groups, subgroups],
  );

  const activeItem = activeId
    ? flatItems.find((i) => i.id === activeId)
    : undefined;

  // While dragging a group, hide its children so only the folder moves.
  const displayItems = useMemo<FlatItem[]>(() => {
    if (activeId && activeItem?.node.type === "group") {
      return removeChildrenOf(flatItems, String(activeId));
    }
    return flatItems;
  }, [flatItems, activeId, activeItem]);

  const sortedIds = useMemo(() => displayItems.map((i) => i.id), [displayItems]);

  const projection: Projection | null =
    activeId && overId
      ? getProjection(
          displayItems,
          String(activeId),
          String(overId),
          offsetLeft,
          SUBGROUP_INDENT_PX,
        )
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const resetDrag = () => {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    setOverId(active.id);
  };

  const handleDragMove = ({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const moved = activeItem;
    const dragOffset = offsetLeft;
    resetDrag();
    if (!over || !moved) return;

    const proj = getProjection(
      displayItems,
      String(active.id),
      String(over.id),
      dragOffset,
      SUBGROUP_INDENT_PX,
    );
    const next = applyDrop(
      displayItems,
      String(active.id),
      String(over.id),
      proj,
    );

    if (moved.node.type === "group") {
      const orderedGroupIds = next
        .filter((i) => i.node.type === "group")
        .map((i) => i.id);
      void reorderGroups(orderedGroupIds);
      return;
    }

    const orderedSiblings = next
      .filter((i) => i.node.type === "subgroup" && i.parentId === proj.parentId)
      .map((i) => i.id);
    void moveSubgroupToGroup(String(active.id), proj.parentId, orderedSiblings);
  };

  const hasContent = flatItems.length > 0;

  return (
    <aside className="flex h-full w-full flex-col border-r bg-sidebar text-sidebar-foreground">
      <div
        style={{
          paddingTop: Number(insets.top) + 8,
          paddingLeft: 16,
        }}
        className="flex min-h-10 items-center gap-2 pr-2"
      >
        <span className="font-semibold">{APP_NAME}</span>
        <ThemeToggle className="ml-auto" />
      </div>

      <SearchBar className="px-2 pt-2" />

      <ScrollArea className="flex-1 min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          measuring={measuring}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={resetDrag}
        >
          <div className="flex flex-col gap-3 py-3">
            <SmartListSection />

            <Separator className="mx-2" />

            <div className="flex flex-col gap-0.5 px-2">
              <SortableContext
                items={sortedIds}
                strategy={verticalListSortingStrategy}
              >
                {displayItems.map((item) => {
                  const isActive = item.id === activeId;
                  if (item.node.type === "group") {
                    return <GroupItem key={item.id} group={item.node.group} />;
                  }
                  const depth =
                    isActive && projection ? projection.depth : item.depth;
                  return (
                    <SubgroupItem
                      key={item.id}
                      subgroup={item.node.subgroup}
                      groups={groups}
                      depth={depth}
                    />
                  );
                })}
              </SortableContext>

              {!hasContent ? (
                <p className="px-3 py-2 text-xs text-muted-foreground/80">
                  Create a list to organize your tasks.
                </p>
              ) : null}
            </div>
          </div>

          <DragOverlay>
            {activeItem ? <DragOverlayRow item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </ScrollArea>

      <div className="flex items-center gap-1 p-2">
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
      </div>

      <NewListDialog open={newListOpen} onOpenChange={setNewListOpen} />
      <NewGroupDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
    </aside>
  );
}
