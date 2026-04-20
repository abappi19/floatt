import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { NotificationProvider } from "@/app/providers/NotificationProvider";
import { TodoScreen } from "@/lib/screens/TodoScreen";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <TodoScreen />
      </NotificationProvider>
    </ThemeProvider>
  );
}
