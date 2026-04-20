import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { TaskList } from "@/lib/components/task-list/TaskList";
import { TaskDetail } from "@/lib/components/task-detail/TaskDetail";
import { SearchResults } from "@/lib/components/search/SearchResults";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/lib/components/ui/resizable";
import { useSearchQuery } from "@/lib/hooks";

export function TodoScreen() {
  const query = useSearchQuery();
  const searching = query.trim().length > 0;

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <ResizablePanelGroup direction="horizontal" autoSaveId="floatt:layout">
        <ResizablePanel defaultSize={20} minSize={14} maxSize={35}>
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={55} minSize={30}>
          <section className="flex h-full flex-col border-r">
            {searching ? <SearchResults /> : <TaskList />}
          </section>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={25} minSize={18} maxSize={45}>
          <TaskDetail />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
