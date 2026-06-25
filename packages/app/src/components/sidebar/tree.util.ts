import { arrayMove } from "@dnd-kit/sortable";
import type { Group, Subgroup } from "@/types";

/**
 * The sidebar tree is intentionally shallow: groups ("folders") live at the
 * root only, and subgroups ("lists"/"files") are either standalone at the root
 * (depth 0) or nested one level inside a group (depth 1). Groups never nest.
 *
 * We flatten that structure into a single ordered list so the whole sidebar can
 * be one dnd-kit SortableContext — that's what makes cross-group drags animate
 * and show drop feedback. See getProjection for how a drag position maps back
 * to a (depth, parentId) within these constraints.
 */

export type FlatNode =
  | { type: "group"; group: Group }
  | { type: "subgroup"; subgroup: Subgroup };

export interface FlatItem {
  id: string;
  /** 0 for groups and standalone subgroups, 1 for grouped subgroups. */
  depth: number;
  /** The owning group id when depth === 1, otherwise null. */
  parentId: string | null;
  node: FlatNode;
}

export interface Projection {
  depth: number;
  parentId: string | null;
}

const MAX_SUBGROUP_DEPTH = 1;

/** Horizontal indent (px) added per depth level. */
export const SUBGROUP_INDENT_PX = 16;
/** Base left padding (px) for a depth-0 row. */
export const TREE_BASE_PADDING_PX = 12;

function bySortOrder<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

/**
 * Build the flat, render-ordered list: each group followed by its (expanded)
 * children, then standalone subgroups at the end.
 */
export function buildFlatTree(
  groups: Group[],
  subgroups: Subgroup[],
): FlatItem[] {
  const childrenByGroup = new Map<string, Subgroup[]>();
  const standalone: Subgroup[] = [];

  for (const sub of subgroups) {
    if (sub.groupId === null) {
      standalone.push(sub);
    } else {
      const list = childrenByGroup.get(sub.groupId) ?? [];
      list.push(sub);
      childrenByGroup.set(sub.groupId, list);
    }
  }

  standalone.sort(bySortOrder);
  for (const list of childrenByGroup.values()) list.sort(bySortOrder);

  const flat: FlatItem[] = [];
  for (const group of [...groups].sort(bySortOrder)) {
    flat.push({
      id: group.id,
      depth: 0,
      parentId: null,
      node: { type: "group", group },
    });
    if (group.isCollapsed) continue;
    for (const sub of childrenByGroup.get(group.id) ?? []) {
      flat.push({
        id: sub.id,
        depth: 1,
        parentId: group.id,
        node: { type: "subgroup", subgroup: sub },
      });
    }
  }

  for (const sub of standalone) {
    flat.push({
      id: sub.id,
      depth: 0,
      parentId: null,
      node: { type: "subgroup", subgroup: sub },
    });
  }

  return flat;
}

/**
 * While a group is being dragged we hide its children from the list so the user
 * drags just the folder (the children ride along on drop). Returns the list to
 * feed into SortableContext + rendering during the drag.
 */
export function removeChildrenOf(
  items: FlatItem[],
  parentId: string,
): FlatItem[] {
  return items.filter((item) => item.parentId !== parentId);
}

function maxDepthFor(prevItem: FlatItem | undefined): number {
  if (!prevItem) return 0; // top of the list is always root
  if (prevItem.node.type === "group") return MAX_SUBGROUP_DEPTH; // first child slot
  return Math.min(prevItem.depth, MAX_SUBGROUP_DEPTH); // sibling of prev
}

function minDepthFor(nextItem: FlatItem | undefined): number {
  // Can't drop above a deeper item — that would split a group apart.
  return nextItem ? nextItem.depth : 0;
}

function parentIdFor(prevItem: FlatItem | undefined): string | null {
  if (!prevItem) return null;
  if (prevItem.node.type === "group") return prevItem.id;
  return prevItem.parentId;
}

/**
 * Map a drag (its over-target + horizontal offset) to a legal drop position.
 * Groups are pinned to the root; subgroups resolve to depth 0/1 with a parent.
 */
export function getProjection(
  items: FlatItem[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentationWidth: number,
): Projection {
  const overIndex = items.findIndex((i) => i.id === overId);
  const activeIndex = items.findIndex((i) => i.id === activeId);
  if (overIndex < 0 || activeIndex < 0) return { depth: 0, parentId: null };

  const activeItem = items[activeIndex];

  // Groups can only ever live at the root.
  if (activeItem.node.type === "group") {
    return { depth: 0, parentId: null };
  }

  const newItems = arrayMove(items, activeIndex, overIndex);
  const prevItem = newItems[overIndex - 1];
  const nextItem = newItems[overIndex + 1];

  const dragDepth = Math.round(dragOffsetX / indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;

  const maxDepth = maxDepthFor(prevItem);
  const minDepth = minDepthFor(nextItem);

  let depth = projectedDepth;
  if (depth > maxDepth) depth = maxDepth;
  if (depth < minDepth) depth = minDepth;

  return {
    depth,
    parentId: depth >= 1 ? parentIdFor(prevItem) : null,
  };
}

/** The flat list reordered + reparented to reflect a completed drag. */
export function applyDrop(
  items: FlatItem[],
  activeId: string,
  overId: string,
  projection: Projection,
): FlatItem[] {
  const activeIndex = items.findIndex((i) => i.id === activeId);
  const overIndex = items.findIndex((i) => i.id === overId);
  if (activeIndex < 0 || overIndex < 0) return items;

  const moved = arrayMove(items, activeIndex, overIndex);
  return moved.map((item) =>
    item.id === activeId
      ? { ...item, depth: projection.depth, parentId: projection.parentId }
      : item,
  );
}
