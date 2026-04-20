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
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";

function toTransform(
  t: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!t) return undefined;
  return `translate3d(${t.x}px, ${t.y}px, 0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}
import type { Task } from "@/types";
import { reorderTasks } from "@/services";
import { TaskRow } from "./TaskRow";

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: toTransform(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskRow task={task} />
    </li>
  );
}

export function SortableTaskList({ tasks }: { tasks: Task[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    void reorderTasks(arrayMove(ids, from, to));
  };

  if (tasks.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-1.5">
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
