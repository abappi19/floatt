import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { NotificationProvider } from "@/app/providers/NotificationProvider";
import { TodoScreen } from "@/lib/screens/TodoScreen";
import { Toaster } from "@/lib/components/ui/toaster";
import { useReminders } from "@/lib/hooks";

function AppShell() {
  useReminders();
  return (
    <>
      <TodoScreen />
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
