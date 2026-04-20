import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { TaskList } from "@/lib/components/task-list/TaskList";
import { TaskDetail } from "@/lib/components/task-detail/TaskDetail";
import { SearchResults } from "@/lib/components/search/SearchResults";
import { useSearchQuery } from "@/lib/hooks";

export function TodoScreen() {
  const query = useSearchQuery();
  const searching = query.trim().length > 0;

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <Sidebar />

      <section className="flex flex-1 flex-col border-r">
        {searching ? <SearchResults /> : <TaskList />}
      </section>

      <TaskDetail />
    </div>
  );
}
