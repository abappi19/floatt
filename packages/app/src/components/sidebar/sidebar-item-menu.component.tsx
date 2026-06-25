import { MoreHorizontal } from "lucide-react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button.ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.ui";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu.ui";
import { cn } from "@/utils/cn.util";

export type SidebarMenuAction =
  | {
      kind: "item";
      label: string;
      onSelect: () => void;
      variant?: "default" | "destructive";
      disabled?: boolean;
    }
  | { kind: "separator" }
  | { kind: "submenu"; label: string; items: SidebarMenuAction[] };

interface MenuFamily {
  Item: ComponentType<{
    variant?: "default" | "destructive";
    disabled?: boolean;
    onSelect?: (event: Event) => void;
    children?: ReactNode;
  }>;
  Separator: ComponentType;
  Sub: ComponentType<{ children?: ReactNode }>;
  SubTrigger: ComponentType<{ children?: ReactNode }>;
  SubContent: ComponentType<{ children?: ReactNode }>;
}

const dropdownFamily: MenuFamily = {
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

const contextFamily: MenuFamily = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

function renderActions(actions: SidebarMenuAction[], f: MenuFamily): ReactNode {
  return actions.map((action, i) => {
    if (action.kind === "separator") return <f.Separator key={i} />;
    if (action.kind === "submenu") {
      return (
        <f.Sub key={i}>
          <f.SubTrigger>{action.label}</f.SubTrigger>
          <f.SubContent>{renderActions(action.items, f)}</f.SubContent>
        </f.Sub>
      );
    }
    return (
      <f.Item
        key={i}
        variant={action.variant}
        disabled={action.disabled}
        onSelect={action.onSelect}
      >
        {action.label}
      </f.Item>
    );
  });
}

interface SidebarItemMenuProps {
  actions: SidebarMenuAction[];
  label?: string;
  className?: string;
}

export function SidebarItemMenu({
  actions,
  label = "Options",
  className,
}: SidebarItemMenuProps) {
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
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {renderActions(actions, dropdownFamily)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SidebarItemContextMenuProps {
  actions: SidebarMenuAction[];
  disabled?: boolean;
  children: ReactElement;
}

export function SidebarItemContextMenu({
  actions,
  disabled,
  children,
}: SidebarItemContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={disabled}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        {renderActions(actions, contextFamily)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
