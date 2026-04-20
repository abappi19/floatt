import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

interface SidebarContextMenuProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function SidebarContextMenu({
  children,
  label = "Options",
  className,
}: SidebarContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100",
            className,
          )}
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
