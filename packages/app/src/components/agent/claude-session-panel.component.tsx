import { useState } from "react";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Textarea } from "@/components/ui/textarea.ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.ui";
import { useClaudeSession } from "@/hooks/use-claude-session";

/** FL-03.1 spike: the smallest session view that proves the `claude` round trip. Dev builds only. */
export function ClaudeSessionPanel() {
  const { available, state, startInfo, cwd, setCwd, send, resume, decide, stop } = useClaudeSession();
  const [claudePath, setClaudePath] = useState("");
  const [text, setText] = useState("");

  if (!available) return null;

  const pathOrDefault = claudePath.trim() || undefined;
  const canSend = text.trim() !== "" && cwd.trim() !== "" && !state.busy;
  const submit = (run: typeof send) => {
    void run(text.trim(), pathOrDefault);
    setText("");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="fixed right-4 bottom-4 z-40">
          Claude
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-3 p-4 sm:max-w-xl">
        <SheetTitle>Claude session (spike)</SheetTitle>
        <SheetDescription className="text-xs">
          {startInfo ? `${startInfo.claudePath} (${startInfo.foundBy})` : "Not started"}
          {state.claudeVersion && ` · v${state.claudeVersion} · ${state.model}`}
          {state.sessionId && ` · ${state.sessionId}`}
          {state.costUsd !== undefined && ` · $${state.costUsd.toFixed(4)}`}
        </SheetDescription>

        <Input placeholder="Working folder (absolute path)" value={cwd} onChange={(e) => setCwd(e.target.value)} />
        <Input
          placeholder="Path to claude (optional)"
          value={claudePath}
          onChange={(e) => setClaudePath(e.target.value)}
        />

        <pre
          aria-live="polite"
          className="min-h-40 flex-1 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap"
        >
          {state.transcript || "Output streams here."}
        </pre>

        {state.pending && (
          <div role="alertdialog" className="space-y-2 rounded-md border border-amber-500/60 p-3 text-sm">
            <p className="font-medium">
              Claude wants to use {state.pending.request.display_name ?? state.pending.request.tool_name}
            </p>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(state.pending.request.input, null, 2)}</pre>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(true)}>
                Allow
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(false)}>
                Deny
              </Button>
            </div>
          </div>
        )}

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Textarea placeholder="Prompt" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" disabled={!canSend} onClick={() => submit(send)}>
            Send
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canSend || state.alive || !state.sessionId}
            onClick={() => submit(resume)}
          >
            Resume
          </Button>
          <Button size="sm" variant="ghost" disabled={!state.alive} onClick={stop}>
            Stop
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
