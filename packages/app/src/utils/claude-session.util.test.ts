import { describe, expect, it } from "vitest";
import type { ClaudeMessage } from "@/types/claude-stream.type";
import {
  claudeSessionReducer,
  initialClaudeSession,
  permissionResponse,
  refuseUnhandledRequest,
  type ClaudeSessionAction,
} from "./claude-session.util";

// Trimmed from a real `claude` 2.1.295 run (stream-json, haiku, approved mcp__floatt__ping).
const approvedRun: ClaudeMessage[] = [
  {
    type: "system",
    subtype: "init",
    session_id: "a7189",
    model: "claude-haiku-5-5",
    claude_code_version: "2.1.295",
    capabilities: ["interrupt_receipt_v1"],
  },
  {
    type: "assistant",
    message: {
      content: [
        { type: "tool_use", id: "toolu_1", name: "mcp__floatt__ping", input: { message: "spike-42" } },
      ],
    },
  },
  {
    type: "control_request",
    request_id: "req-1",
    request: {
      subtype: "can_use_tool",
      tool_name: "mcp__floatt__ping",
      input: { message: "spike-42" },
      tool_use_id: "toolu_1",
      display_name: "Ping",
    },
  },
];

const finish: ClaudeMessage[] = [
  {
    type: "stream_event",
    event: { type: "content_block_delta", delta: { type: "text_delta", text: "pong from " } },
  },
  {
    type: "stream_event",
    event: { type: "content_block_delta", delta: { type: "text_delta", text: "Floatt: spike-42" } },
  },
  {
    type: "result",
    subtype: "success",
    session_id: "a7189",
    is_error: false,
    total_cost_usd: 0.0012,
    duration_ms: 3214,
  },
];

const run = (actions: ClaudeSessionAction[]) =>
  actions.reduce(claudeSessionReducer, initialClaudeSession);

describe("claudeSessionReducer", () => {
  it("holds the permission prompt until the turn goes on", () => {
    const state = run([{ type: "floatt_prompt", text: "ping" }, ...approvedRun]);
    expect(state).toMatchObject({ alive: true, busy: true, sessionId: "a7189", claudeVersion: "2.1.295" });
    expect(state.pending?.requestId).toBe("req-1");
    expect(permissionResponse(state.pending!, true)).toEqual({
      type: "control_response",
      response: {
        subtype: "success",
        request_id: "req-1",
        response: { behavior: "allow", updatedInput: { message: "spike-42" }, toolUseID: "toolu_1" },
      },
    });
  });

  it("streams text, ends the turn, then the process", () => {
    const afterTurn = run([{ type: "floatt_prompt", text: "ping" }, ...approvedRun, ...finish]);
    expect(afterTurn.transcript).toContain("pong from Floatt: spike-42");
    expect(afterTurn).toMatchObject({ busy: false, alive: true, costUsd: 0.0012 });

    const exited = claudeSessionReducer(afterTurn, { type: "floatt_exit", code: 0 });
    expect(exited).toMatchObject({ alive: false, pending: undefined, error: undefined });
  });

  it("ignores messages it doesn't know, including other system subtypes", () => {
    const started = run(approvedRun.slice(0, 1));
    const after = run([
      ...approvedRun.slice(0, 1),
      { type: "system", subtype: "status", status: "requesting" },
      { type: "rate_limit_event", rate_limit_info: { status: "allowed" } },
    ] as unknown as ClaudeSessionAction[]);
    expect(after).toEqual(started);
  });

  it("explains a failed start with claude's last stderr line", () => {
    const state = run([
      { type: "floatt_prompt", text: "hi" },
      { type: "floatt_stderr", line: "No conversation found with session ID: 0000" },
      { type: "floatt_exit", code: 1 },
    ]);
    expect(state.error).toBe("claude exited with code 1: No conversation found with session ID: 0000");

    const raced = claudeSessionReducer(state, { type: "floatt_error", message: "claude isn't running" });
    expect(raced.error).toBe(state.error);
  });

  it("shows why a turn failed", () => {
    const state = run([
      { type: "floatt_prompt", text: "hello" },
      {
        type: "result",
        subtype: "success",
        session_id: "s",
        is_error: true,
        total_cost_usd: 0,
        duration_ms: 1,
        result: "Not logged in · Please run /login",
      },
    ]);
    expect(state.error).toBe("Not logged in · Please run /login");
  });

  it("drops a prompt claude withdrew", () => {
    const state = run([...approvedRun, { type: "control_cancel_request", request_id: "req-1" }]);
    expect(state.pending).toBeUndefined();
  });
});

describe("refuseUnhandledRequest", () => {
  it("answers unknown control requests and leaves approvals to the user", () => {
    expect(refuseUnhandledRequest(approvedRun[2])).toBeUndefined();
    expect(
      refuseUnhandledRequest({ type: "control_request", request_id: "req-2", request: { subtype: "elicitation" } }),
    ).toMatchObject({ response: { subtype: "error", request_id: "req-2" } });
  });
});
