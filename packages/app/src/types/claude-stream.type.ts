// The subset of `claude -p --input-format stream-json --output-format stream-json` that Floatt reads
// and writes. Message shapes follow the Agent SDK's published types (SDKMessage, SDKControlRequest,
// SDKControlResponse in @anthropic-ai/claude-agent-sdk 0.3.295); the control_request/control_response
// framing is not in the public docs. Messages not listed here are ignored.

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "thinking" | "tool_result" };

export interface ClaudeCanUseToolRequest {
  subtype: "can_use_tool";
  tool_name: string;
  input: Record<string, unknown>;
  tool_use_id: string;
  title?: string;
  display_name?: string;
}

export type ClaudeMessage =
  | {
      type: "system";
      subtype: "init";
      session_id: string;
      model: string;
      claude_code_version: string;
      capabilities?: string[];
    }
  | {
      type: "stream_event";
      event: { type: string; delta?: { type: string; text?: string } };
    }
  | { type: "assistant"; message: { content: ClaudeContentBlock[] } }
  | {
      type: "result";
      subtype: string;
      session_id: string;
      is_error: boolean;
      total_cost_usd: number;
      duration_ms: number;
      /** The final text; on an error it says what went wrong (e.g. "Not logged in · Please run /login"). */
      result?: string;
    }
  | {
      type: "control_request";
      request_id: string;
      request: ClaudeCanUseToolRequest | { subtype: string };
    }
  | { type: "control_cancel_request"; request_id: string }
  /** Sent by Floatt's Rust host: a line `claude` wrote to stderr, and the process ending. */
  | { type: "floatt_stderr"; line: string }
  | { type: "floatt_exit"; code: number | null };

export type ClaudeInput =
  | {
      type: "user";
      session_id: "";
      message: { role: "user"; content: { type: "text"; text: string }[] };
      parent_tool_use_id: null;
    }
  | {
      type: "control_response";
      response:
        | {
            subtype: "success";
            request_id: string;
            response: Record<string, unknown>;
          }
        | { subtype: "error"; request_id: string; error: string };
    };
