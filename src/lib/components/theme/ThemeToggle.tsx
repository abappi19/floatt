import { Moon, Sun } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { useTheme, useToggleTheme } from "@/lib/hooks";

export function ThemeToggle() {
  const theme = useTheme();
  const toggle = useToggleTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
