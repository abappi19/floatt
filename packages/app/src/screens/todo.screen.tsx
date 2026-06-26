import { Sidebar } from "@/components/sidebar/sidebar.component";
import { TaskList } from "@/components/task-list/task-list.component";
import { TaskDetail } from "@/components/task-detail/task-detail.component";
import { SearchResults } from "@/components/search/search-results.component";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.ui";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet.ui";
import { VisuallyHidden } from "radix-ui";
import {
  useMediaQuery,
  useResizableSheetWidth,
  useSearchQuery,
  useSelectedTaskId,
  useSelectTask,
} from "@/hooks";
import { cn } from "@/utils/cn.util";
import { DragRegion } from "@/components/chrome/drag-region.component";
import { WindowControls } from "@/components/chrome/window-controls.component";

export function TodoScreen() {
  const query = useSearchQuery();
  const searching = query.trim().length > 0;
  const isNarrow = useMediaQuery("(max-width: 900px)");
  const selectedTaskId = useSelectedTaskId();
  const selectTask = useSelectTask();

  const detailSheetOpen = isNarrow && selectedTaskId !== null;
  const showDetailPanel = !isNarrow && selectedTaskId !== null;
  const { width: sheetWidth, dragging, onPointerDown } = useResizableSheetWidth();

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={isNarrow ? "floatt:layout-narrow" : "floatt:layout"}
      >
        <ResizablePanel
          id="sidebar"
          order={1}
          defaultSize={isNarrow ? 30 : 20}
          minSize={isNarrow ? 20 : 14}
          maxSize={isNarrow ? 50 : 35}
        >
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel
          id="main"
          order={2}
          defaultSize={isNarrow ? 70 : showDetailPanel ? 55 : 80}
          minSize={30}
        >
          <section className="flex h-full flex-col">
            {searching ? <SearchResults /> : <TaskList />}
          </section>
        </ResizablePanel>

        {showDetailPanel && (
          <>
            <ResizableHandle />
            <ResizablePanel
              id="detail"
              order={3}
              defaultSize={25}
              minSize={18}
              maxSize={45}
            >
              <TaskDetail />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <Sheet
        open={detailSheetOpen}
        onOpenChange={(open) => {
          if (!open) selectTask(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            "p-0 max-w-[90vw] sm:max-w-[90vw]",
            dragging && "transition-none",
          )}
          style={{ width: sheetWidth }}
          showCloseButton={false}
        >
          <VisuallyHidden.Root>
            <SheetTitle>Task details</SheetTitle>
          </VisuallyHidden.Root>
          <div
            role="separator"
            aria-orientation="vertical"
            onPointerDown={onPointerDown}
            className={cn(
              "absolute inset-y-0 left-0 z-10 w-1.5 -translate-x-1/2 cursor-col-resize touch-none",
              "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border",
              "hover:after:bg-primary/40",
              dragging && "after:bg-primary/60",
            )}
          />
          <TaskDetail />
        </SheetContent>
      </Sheet>

      <DragRegion />
      <WindowControls />
    </div>
  );
}
