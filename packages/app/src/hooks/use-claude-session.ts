import { useEffect, useReducer, useState } from "react";
import { usePlatform } from "@/providers/platform.provider";
import type { AgentStartInfo } from "@/platform/platform.type";
import {
  claudeSessionReducer,
  initialClaudeSession,
  permissionResponse,
  refuseUnhandledRequest,
  userMessage,
} from "@/utils/claude-session.util";

const LAST_SESSION_KEY = "floatt.claude.lastSession";

// ponytail: localStorage keeps the last session across restarts; FL-03.4 moves run state to SQLite.
function recallLastSession(): { sessionId?: string; cwd?: string } {
  try {
    return JSON.parse(localStorage.getItem(LAST_SESSION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function useClaudeSession() {
  const { agent } = usePlatform();
  const [lastSession] = useState(recallLastSession);
  const [state, dispatch] = useReducer(claudeSessionReducer, {
    ...initialClaudeSession,
    sessionId: lastSession.sessionId,
  });
  const [startInfo, setStartInfo] = useState<AgentStartInfo>();
  const [cwd, setCwd] = useState(lastSession.cwd ?? "");

  useEffect(() => {
    try {
      localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({ sessionId: state.sessionId, cwd }));
    } catch {
      // Not remembering the session only costs the Resume button after a restart.
    }
  }, [state.sessionId, cwd]);

  useEffect(
    () =>
      agent?.subscribe((message) => {
        dispatch(message);
        const refusal = refuseUnhandledRequest(message);
        if (refusal) void agent.send(refusal);
      }),
    [agent],
  );

  async function prompt(text: string, start?: { cwd: string; resume?: string; claudePath?: string }) {
    if (!agent) return;
    try {
      dispatch({ type: "floatt_prompt", text });
      if (start) setStartInfo(await agent.start(start));
      await agent.send(userMessage(text));
    } catch (error) {
      dispatch({ type: "floatt_error", message: String(error) });
    }
  }

  return {
    available: agent !== undefined,
    state,
    startInfo,
    cwd,
    setCwd,
    /** Sends to the running session, or starts a new one in `cwd`. */
    send: (text: string, claudePath?: string) =>
      prompt(text, state.alive ? undefined : { cwd: cwd.trim(), claudePath }),
    resume: (text: string, claudePath?: string) =>
      prompt(text, { cwd: cwd.trim(), claudePath, resume: state.sessionId }),
    decide: (allow: boolean) => {
      if (!agent || !state.pending) return;
      void agent.send(permissionResponse(state.pending, allow));
      dispatch({ type: "control_cancel_request", request_id: state.pending.requestId });
    },
    stop: () => void agent?.stop(),
  };
}
