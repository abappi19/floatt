import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import { Textarea } from "@/lib/components/ui/textarea";
import { setTaskNotes } from "@/lib/services";

interface NotesEditorProps {
  taskId: string;
  initialNotes: string;
}

export function NotesEditor({ taskId, initialNotes }: NotesEditorProps) {
  const [value, setValue] = useState(initialNotes);

  useEffect(() => {
    setValue(initialNotes);
  }, [taskId, initialNotes]);

  const handleBlur = () => {
    if (value === initialNotes) return;
    void setTaskNotes(taskId, value);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <StickyNote className="size-3.5" />
        Note
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add note"
        className="min-h-24"
      />
    </div>
  );
}
