import { ThemeProvider } from "@/providers/theme.provider";
import { NotificationProvider } from "@/providers/notification.provider";
import { TodoScreen } from "@/screens/todo.screen";
import { Toaster } from "@/components/ui/toaster.ui";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog.ui";
import { useCommandStore } from "@/stores";
import { useUiStore } from "@/stores/ui.store";
import {
  useBlockNativeContextMenu,
  useKeyboardShortcuts,
  useReminders,
} from "@/hooks";
import { deleteTask } from "@/services";

function DeleteTaskConfirm() {
  const requestedId = useCommandStore((s) => s.deleteRequestId);
  const clearRequest = useCommandStore((s) => s.clearDeleteRequest);
  const selectTask = useUiStore((s) => s.selectTask);

  const onConfirm = () => {
    if (!requestedId) return;
    void deleteTask(requestedId).then(() => selectTask(null));
  };

  return (
    <ConfirmDestructiveDialog
      open={!!requestedId}
      onOpenChange={(o) => {
        if (!o) clearRequest();
      }}
      title="Delete this task?"
      description="This task and all its steps will be permanently removed."
      onConfirm={onConfirm}
    />
  );
}

function AppShell() {
  useReminders();
  useKeyboardShortcuts();
  useBlockNativeContextMenu();
  return (
    <>
      <TodoScreen />
      <DeleteTaskConfirm />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
    </ThemeProvider>
  );
}
