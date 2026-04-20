import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

function toTransform(
  t: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!t) return undefined;
  return `translate3d(${t.x}px, ${t.y}px, 0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}
import { cn } from "@/lib/utils/cn";
import { createSubtask, reorderSubtasks } from "@/lib/services";
import { useSubtasks } from "@/lib/hooks";
import type { Subtask } from "@/lib/types";
import { SubtaskRow } from "./SubtaskRow";

interface SubtaskListProps {
  taskId: string;
}

function SortableSubtask({ subtask }: { subtask: Subtask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id });
  const style: React.CSSProperties = {
    transform: toTransform(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SubtaskRow subtask={subtask} />
    </div>
  );
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const subtasks = useSubtasks(taskId);
  const [title, setTitle] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = subtasks.map((s) => s.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    void reorderSubtasks(arrayMove(ids, from, to));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createSubtask({ title: trimmed, taskId });
    setTitle("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1">
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={subtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {subtasks.map((s) => (
            <SortableSubtask key={s.id} subtask={s} />
          ))}
        </SortableContext>
      </DndContext>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "mt-1 flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:bg-accent/40",
          isFocused && "border-ring bg-accent/40",
        )}
      >
        <Plus
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            isFocused && "text-primary",
          )}
        />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Add step"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>
    </div>
  );
}
