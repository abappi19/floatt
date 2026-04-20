import { useMemo, useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Separator } from "@/lib/components/ui/separator";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { APP_NAME } from "@/lib/consts";
import { useGroups, useSubgroups } from "@/lib/hooks";
import { SearchBar } from "@/lib/components/search/SearchBar";
import { ThemeToggle } from "@/lib/components/theme/ThemeToggle";
import { SmartListSection } from "./SmartListSection";
import { GroupItem } from "./GroupItem";
import { SubgroupItem } from "./SubgroupItem";
import { NewListDialog } from "./NewListDialog";
import { NewGroupDialog } from "./NewGroupDialog";

export function Sidebar() {
  const groups = useGroups();
  const subgroups = useSubgroups();
  const [newListOpen, setNewListOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  const standaloneSubgroups = useMemo(
    () => subgroups.filter((s) => s.groupId === null),
    [subgroups],
  );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <span className="font-semibold">{APP_NAME}</span>
      </div>

      <div className="border-b p-3">
        <SearchBar />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 py-3">
          <SmartListSection />

          <Separator className="mx-2" />

          <div className="flex flex-col gap-1 px-2">
            {groups.map((g) => (
              <GroupItem key={g.id} group={g} allGroups={groups} />
            ))}
            {standaloneSubgroups.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {standaloneSubgroups.map((s) => (
                  <li key={s.id}>
                    <SubgroupItem subgroup={s} groups={groups} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center gap-1 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start"
          onClick={() => setNewListOpen(true)}
        >
          <Plus />
          New list
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setNewGroupOpen(true)}
          aria-label="New group"
        >
          <FolderPlus />
        </Button>
        <ThemeToggle />
      </div>

      <NewListDialog open={newListOpen} onOpenChange={setNewListOpen} />
      <NewGroupDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
    </aside>
  );
}
