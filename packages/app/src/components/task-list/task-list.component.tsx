import { ScrollArea } from "@/components/ui/scroll-area.ui";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog.ui";
import { SidebarItemMenu } from "@/components/sidebar/sidebar-item-menu.component";
import { themeStyle } from "@/consts";
import {
  useListOptions,
  useListTheme,
  useListTitle,
  useSelectedList,
  useTaskSort,
  useTheme,
  useWindowInsets,
} from "@/hooks";
import { MyDaySuggestions } from "./my-day-suggestions.component";
import { NewTaskInput } from "./new-task-input.component";
import { ThemePopover } from "./theme-popover.component";
import { ListBodyDispatcher } from "./task-list/list-body-dispatcher.component";

export function TaskList() {
  const selection = useSelectedList();
  const sort = useTaskSort();
  const title = useListTitle(selection);
  const insets = useWindowInsets();
  const options = useListOptions(selection);
  const theme = useListTheme(selection);
  const mode = useTheme();

  return (
    <div
      className="flex h-full flex-col"
      style={themeStyle(theme, mode) as React.CSSProperties}
    >
      <header style={{ paddingTop: insets.top || undefined }} className="px-6">
        <div className="flex items-center gap-3">
          {
            options.isRenaming && options.subgroup
              ? (
                <input
                  ref={options.renameInputRef}
                  value={options.draftName}
                  onChange={(e) => options.setDraftName(e.target.value)}
                  onBlur={options.commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      options.commitRename();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      options.cancelRename();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-2xl font-bold tracking-tight outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
                />
              )
              : (
                <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
                  {title}
                </h1>
              )
          }
          <ThemePopover selection={selection} />
          <SidebarItemMenu
            actions={options.actions}
            label={`${title} options`}
            className="bg-muted text-muted-foreground opacity-100 hover:bg-muted/80 hover:text-foreground"
          />
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex min-h-full flex-col gap-3 px-3 py-3">
          {selection.kind === "smart" && selection.id === "my-day" ? (
            <MyDaySuggestions />
          ) : null}
          <ListBodyDispatcher selection={selection} sort={sort} />
        </div>
      </ScrollArea>

      <div className="p-3 opacity-95">
        <NewTaskInput selection={selection} />
      </div>

      <ConfirmDestructiveDialog
        open={options.confirmDelete}
        onOpenChange={options.setConfirmDelete}
        title={
          options.subgroup
            ? `Delete "${options.subgroup.name}"?`
            : "Delete list?"
        }
        description="This permanently deletes the list and all its tasks."
        onConfirm={options.deleteList}
      />
    </div>
  );
}
