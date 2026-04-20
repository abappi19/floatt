import { useTask, useSelectedTaskId } from "@/lib/hooks";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { relativeDue } from "@/lib/utils";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { SubtaskList } from "./SubtaskList";
import { AddToMyDayButton } from "./AddToMyDayButton";
import { ReminderPicker } from "./ReminderPicker";
import { DueDatePicker } from "./DueDatePicker";
import { RepeatPicker } from "./RepeatPicker";
import { NotesEditor } from "./NotesEditor";

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Select a task to see its details.
    </div>
  );
}

export function TaskDetail() {
  const selectedId = useSelectedTaskId();
  const task = useTask(selectedId);

  return (
    <aside className="flex w-80 flex-col border-l bg-muted/20">
      <div className="flex h-12 items-center border-b px-4">
        <span className="font-semibold">Details</span>
      </div>

      {!selectedId || !task ? (
        <EmptyState />
      ) : (
        <div
          key={task.id}
          className="flex flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200"
        >
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 p-3">
              <TaskDetailHeader task={task} />

              <div className="rounded-md border bg-card p-2 shadow-xs">
                <SubtaskList taskId={task.id} />
              </div>

              <div className="flex flex-col rounded-md border bg-card shadow-xs">
                <AddToMyDayButton task={task} />
                <div className="border-t" />
                <ReminderPicker task={task} />
                <div className="border-t" />
                <DueDatePicker task={task} />
                <div className="border-t" />
                <RepeatPicker task={task} />
              </div>

              <NotesEditor taskId={task.id} initialNotes={task.notes} />
            </div>
          </ScrollArea>

          <footer className="border-t px-4 py-2 text-[11px] text-muted-foreground">
            Created {relativeDue(task.createdAt)}
          </footer>
        </div>
      )}
    </aside>
  );
}
