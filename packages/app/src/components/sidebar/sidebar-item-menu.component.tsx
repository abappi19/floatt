import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cloneElement, createElement } from "react";
import type {
  ComponentType,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
import { usePlatform } from "@/providers";
import type { PlatformMenuItem } from "@/platform";

export type SidebarMenuAction =
  | {
      kind: "item";
      label: string;
      onSelect: () => void;
      variant?: "default" | "destructive";
      disabled?: boolean;
      icon?: LucideIcon;
    }
  | { kind: "separator" }
  | {
      kind: "submenu";
      label: string;
      items: SidebarMenuAction[];
      icon?: LucideIcon;
    };

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
          <f.SubTrigger>
            {action.icon ? <action.icon /> : null}
            {action.label}
          </f.SubTrigger>
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
        {action.icon ? <action.icon /> : null}
        {action.label}
      </f.Item>
    );
  });
}

function iconToSvg(Icon?: LucideIcon): string | undefined {
  if (!Icon) return undefined;
  return renderToStaticMarkup(createElement(Icon, { size: 16 }));
}

/** Map the React-flavored actions onto the serializable shape the native menu consumes. */
function toPlatformItems(actions: SidebarMenuAction[]): PlatformMenuItem[] {
  return actions.map((action) => {
    if (action.kind === "separator") return { kind: "separator" };
    if (action.kind === "submenu") {
      return {
        kind: "submenu",
        label: action.label,
        icon: iconToSvg(action.icon),
        items: toPlatformItems(action.items),
      };
    }
    return {
      kind: "item",
      label: action.label,
      onSelect: action.onSelect,
      disabled: action.disabled,
      icon: iconToSvg(action.icon),
    };
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
  const { menu } = usePlatform();

  if (menu.presentation === "native") {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        className={cn(
          "opacity-0 transition-opacity group-hover:opacity-100",
          className,
        )}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          void menu.popup(toPlatformItems(actions), {
            x: rect.left,
            y: rect.bottom,
          });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <MoreHorizontal />
      </Button>
    );
  }

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
  const { menu } = usePlatform();

  if (menu.presentation === "native") {
    const childOnContextMenu = (
      children.props as {
        onContextMenu?: (e: ReactMouseEvent) => void;
      }
    ).onContextMenu;
    return cloneElement(children, {
      onContextMenu: (e: ReactMouseEvent) => {
        childOnContextMenu?.(e);
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        void menu.popup(toPlatformItems(actions), {
          x: e.clientX,
          y: e.clientY,
        });
      },
    } as Partial<typeof children.props>);
  }

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
