import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, useToggleTheme } from "@/hooks";

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
