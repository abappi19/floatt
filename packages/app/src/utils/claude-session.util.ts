import type {
  ClaudeCanUseToolRequest,
  ClaudeInput,
  ClaudeMessage,
} from "@/types/claude-stream.type";

export interface PendingPermission {
  requestId: string;
  request: ClaudeCanUseToolRequest;
}

export interface ClaudeSessionState {
  /** A `claude` process is running and accepts more prompts. */
  alive: boolean;
  /** A turn is in flight. */
  busy: boolean;
  sessionId?: string;
  claudeVersion?: string;
  capabilities?: string[];
  model?: string;
  transcript: string;
  pending?: PendingPermission;
  costUsd?: number;
  error?: string;
  /** Why `claude` refused to start usually only shows up here (bad session id, bad flag). */
  lastStderr?: string;
}

export type ClaudeSessionAction =
  | ClaudeMessage
  | { type: "floatt_prompt"; text: string }
  | { type: "floatt_error"; message: string };

export const initialClaudeSession: ClaudeSessionState = {
  alive: false,
  busy: false,
  transcript: "",
};

// `claude` sends many message types this view ignores (rate limits, status, hooks, retries…),
// so anything unrecognised must leave the state as it is.
export function claudeSessionReducer(
  state: ClaudeSessionState,
  action: ClaudeSessionAction,
): ClaudeSessionState {
  switch (action.type) {
    case "floatt_prompt":
      return {
        ...state,
        alive: true,
        busy: true,
        error: undefined,
        lastStderr: undefined,
        transcript: `${state.transcript}\n> ${action.text}\n`,
      };
    // A failed start or write means there's no usable process. If `claude` already said why it
    // exited, that beats the generic write error that races with it.
    case "floatt_error":
      return { ...state, alive: false, busy: false, error: state.error ?? action.message };
    case "system":
      if (action.subtype !== "init") return state;
      return {
        ...state,
        sessionId: action.session_id,
        claudeVersion: action.claude_code_version,
        capabilities: action.capabilities,
        model: action.model,
      };
    case "stream_event":
      return action.event.delta?.type === "text_delta"
        ? { ...state, transcript: state.transcript + (action.event.delta.text ?? "") }
        : state;
    case "assistant": {
      const toolCalls = action.message.content.flatMap((block) =>
        block.type === "tool_use"
          ? [`\n[${block.name} ${JSON.stringify(block.input)}]\n`]
          : [],
      );
      return toolCalls.length
        ? { ...state, transcript: state.transcript + toolCalls.join("") }
        : state;
    }
    case "control_request":
      return action.request.subtype === "can_use_tool"
        ? {
            ...state,
            pending: {
              requestId: action.request_id,
              request: action.request as ClaudeCanUseToolRequest,
            },
          }
        : state;
    case "control_cancel_request":
      return state.pending?.requestId === action.request_id
        ? { ...state, pending: undefined }
        : state;
    case "result":
      return {
        ...state,
        busy: false,
        sessionId: action.session_id,
        costUsd: action.total_cost_usd,
        error: action.is_error ? action.result || `Turn ended with ${action.subtype}` : undefined,
        transcript: `${state.transcript}\n`,
      };
    case "floatt_stderr":
      return { ...state, lastStderr: action.line };
    case "floatt_exit":
      return {
        ...state,
        alive: false,
        busy: false,
        pending: undefined,
        error:
          action.code && action.code !== 0
            ? [`claude exited with code ${action.code}`, state.lastStderr].filter(Boolean).join(": ")
            : state.error,
      };
    default:
      return state;
  }
}

export function userMessage(text: string): ClaudeInput {
  return {
    type: "user",
    session_id: "",
    message: { role: "user", content: [{ type: "text", text }] },
    parent_tool_use_id: null,
  };
}

export function permissionResponse(
  { requestId, request }: PendingPermission,
  allow: boolean,
): ClaudeInput {
  return {
    type: "control_response",
    response: {
      subtype: "success",
      request_id: requestId,
      response: allow
        ? { behavior: "allow", updatedInput: request.input, toolUseID: request.tool_use_id }
        : {
            behavior: "deny",
            message: "The user denied this in Floatt.",
            toolUseID: request.tool_use_id,
          },
    },
  };
}

/** `claude` waits forever on a control_request nobody answers, so refuse the ones Floatt doesn't handle yet. */
export function refuseUnhandledRequest(
  message: ClaudeMessage,
): ClaudeInput | undefined {
  if (message.type !== "control_request") return undefined;
  if (message.request.subtype === "can_use_tool") return undefined;
  return {
    type: "control_response",
    response: {
      subtype: "error",
      request_id: message.request_id,
      error: `Floatt doesn't handle ${message.request.subtype} yet`,
    },
  };
}
