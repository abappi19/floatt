import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  subgroupCreateFormSchema,
  type SubgroupCreateForm,
} from "@/schemas";
import { useGroups } from "@/hooks";
import { createSubgroup } from "@/services";
import { cn } from "@/utils/cn";

interface NewListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string | null;
  onCreated?: (subgroupId: string) => void;
}

export function NewListDialog({
  open,
  onOpenChange,
  defaultGroupId = null,
  onCreated,
}: NewListDialogProps) {
  const groups = useGroups();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubgroupCreateForm>({
    resolver: zodResolver(subgroupCreateFormSchema),
    defaultValues: { name: "", groupId: defaultGroupId },
  });

  useEffect(() => {
    if (open) {
      reset({ name: "", groupId: defaultGroupId });
    }
  }, [open, defaultGroupId, reset]);

  const onSubmit = async (values: SubgroupCreateForm) => {
    const created = await createSubgroup({
      name: values.name,
      groupId: values.groupId ?? null,
    });
    onCreated?.(created.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
          <DialogDescription>Create a list to organize tasks.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="list-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="list-name"
              autoFocus
              placeholder="Untitled list"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name ? (
              <span className="text-xs text-destructive">
                {errors.name.message}
              </span>
            ) : null}
          </div>
          {groups.length > 0 ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="list-group" className="text-sm font-medium">
                Group
              </label>
              <select
                id="list-group"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                )}
                {...register("groupId", {
                  setValueAs: (v) => (v === "" ? null : v),
                })}
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
