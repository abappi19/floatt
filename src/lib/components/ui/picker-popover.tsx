import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { cn } from "@/lib/utils/cn";

function PickerPopoverTrigger({
  className,
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      data-slot="picker-popover-trigger"
      className={cn(
        "flex w-full items-center gap-3 rounded-md border border-transparent bg-transparent px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function PickerPopoverContent({
  className,
  align = "start",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="picker-popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn("w-auto min-w-56 p-2", className)}
      {...props}
    />
  );
}

export {
  Popover as PickerPopover,
  PickerPopoverTrigger,
  PickerPopoverContent,
};
