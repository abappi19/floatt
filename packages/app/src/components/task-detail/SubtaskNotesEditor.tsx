import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { setSubtaskNotes } from "@/services";

interface SubtaskNotesEditorProps {
  subtaskId: string;
  initialNotes: string;
}

export function SubtaskNotesEditor({
  subtaskId,
  initialNotes,
}: SubtaskNotesEditorProps) {
  const [value, setValue] = useState(initialNotes);

  useEffect(() => {
    setValue(initialNotes);
  }, [subtaskId, initialNotes]);

  const handleBlur = () => {
    if (value === initialNotes) return;
    void setSubtaskNotes(subtaskId, value);
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="Add note"
      className="min-h-14 text-sm"
    />
  );
}
