import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, useToggleTheme } from "@/hooks";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const toggle = useToggleTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="Toggle theme"
      className={className}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
