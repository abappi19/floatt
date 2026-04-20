import { ThemeProvider } from "@/providers/ThemeProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { TodoScreen } from "@/screens/TodoScreen";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { useCommandStore } from "@/stores";
import { useUiStore } from "@/stores/ui.store";
import { useKeyboardShortcuts, useReminders } from "@/hooks";
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
