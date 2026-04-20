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
  groupCreateFormSchema,
  type GroupCreateForm,
} from "@/schemas";
import { createGroup } from "@/services";

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
}

export function NewGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: NewGroupDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupCreateForm>({
    resolver: zodResolver(groupCreateFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) reset({ name: "" });
  }, [open, reset]);

  const onSubmit = async (values: GroupCreateForm) => {
    const created = await createGroup(values.name);
    onCreated?.(created.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
          <DialogDescription>
            Groups organize multiple lists together.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="group-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="group-name"
              autoFocus
              placeholder="Untitled group"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name ? (
              <span className="text-xs text-destructive">
                {errors.name.message}
              </span>
            ) : null}
          </div>
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
