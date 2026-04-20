import { Moon, Sun } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { useTheme } from "@/app/providers/ThemeProvider";

export function TodoScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">Floatt</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Sidebar — smart lists + groups arrive in Phase 5
        </div>
      </aside>

      <section className="flex-1 border-r">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">Tasks</span>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Task list — Phase 6
        </div>
      </section>

      <aside className="w-80">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">Details</span>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Task detail — Phase 7
        </div>
      </aside>
    </div>
  );
}
