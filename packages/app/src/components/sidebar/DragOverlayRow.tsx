import { Folder, ListTodo } from "lucide-react";
import { type FlatItem } from "./tree";

export function DragOverlayRow({ item }: { item: FlatItem }) {
  const isGroup = item.node.type === "group";
  const name =
    item.node.type === "group" ? item.node.group.name : item.node.subgroup.name;
  return (
    <div className="flex w-full items-center gap-2 rounded-md border bg-sidebar px-3 py-1.5 text-sm shadow-md">
      {isGroup ? (
        <Folder className="size-4 shrink-0" />
      ) : (
        <ListTodo className="size-4 shrink-0" />
      )}
      <span className="truncate font-medium">{name}</span>
    </div>
  );
}
