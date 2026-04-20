import { Bell, X } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast.store";
import { cn } from "@/lib/utils/cn";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex gap-2 rounded-md border bg-card p-3 shadow-lg",
            "animate-in slide-in-from-right-4 fade-in",
          )}
        >
          <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex-1 text-sm">
            <div className="font-medium">{t.title}</div>
            {t.body ? (
              <div className="text-muted-foreground">{t.body}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
