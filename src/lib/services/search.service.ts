import Fuse from "fuse.js";
import type { Task } from "@/lib/types";

export interface SearchableTask {
  id: string;
  title: string;
  notes: string;
}

let fuse: Fuse<SearchableTask> | null = null;

export function buildSearchIndex(tasks: Task[]): void {
  const docs: SearchableTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
  }));
  fuse = new Fuse(docs, {
    keys: ["title", "notes"],
    threshold: 0.35,
    ignoreLocation: true,
  });
}

export function searchTasks(query: string): SearchableTask[] {
  if (!fuse || !query.trim()) return [];
  return fuse.search(query).map((r) => r.item);
}
