import { PlatformProvider } from "@floatt/app/providers";
import { desktopPlatform } from "@/platform/platform.desktop";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { NotificationProvider } from "@/app/providers/NotificationProvider";
import { TodoScreen } from "@/lib/screens/TodoScreen";
import { Toaster } from "@/lib/components/ui/toaster";
import { ConfirmDestructiveDialog } from "@/lib/components/ui/confirm-destructive-dialog";
import { useCommandStore } from "@/lib/stores";
import { useUiStore } from "@/lib/stores/ui.store";
import { useKeyboardShortcuts, useReminders } from "@/lib/hooks";
import { deleteTask } from "@/lib/services";

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
    <PlatformProvider platform={desktopPlatform}>
      <ThemeProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </ThemeProvider>
    </PlatformProvider>
  );
}
