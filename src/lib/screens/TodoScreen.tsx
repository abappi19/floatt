import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { TaskList } from "@/lib/components/task-list/TaskList";
import { TaskDetail } from "@/lib/components/task-detail/TaskDetail";
import { SearchResults } from "@/lib/components/search/SearchResults";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/lib/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/lib/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";
import {
  useMediaQuery,
  useSearchQuery,
  useSelectedTaskId,
  useSelectTask,
} from "@/lib/hooks";

export function TodoScreen() {
  const query = useSearchQuery();
  const searching = query.trim().length > 0;
  const isNarrow = useMediaQuery("(max-width: 900px)");
  const selectedTaskId = useSelectedTaskId();
  const selectTask = useSelectTask();

  const detailOpen = isNarrow && selectedTaskId !== null;

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={isNarrow ? "floatt:layout-narrow" : "floatt:layout"}
      >
        <ResizablePanel
          defaultSize={isNarrow ? 30 : 20}
          minSize={isNarrow ? 20 : 14}
          maxSize={isNarrow ? 50 : 35}
        >
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={isNarrow ? 70 : 55} minSize={30}>
          <section className="flex h-full flex-col border-r">
            {searching ? <SearchResults /> : <TaskList />}
          </section>
        </ResizablePanel>

        {!isNarrow && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={25} minSize={18} maxSize={45}>
              <TaskDetail />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <Sheet
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) selectTask(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full p-0 sm:max-w-md"
          showCloseButton={false}
        >
          <VisuallyHidden.Root>
            <SheetTitle>Task details</SheetTitle>
          </VisuallyHidden.Root>
          <TaskDetail />
        </SheetContent>
      </Sheet>
    </div>
  );
}
