# B. Integrating Claude Code (and VS Code) into Floatt: technical design

researcherB. Researched 2026-10-08 against code.claude.com docs (Claude Code v2.1.29x, Agent SDK v0.3.2xx) and a read-only look at `repos/floatt`. Items marked **[unverified]** come from memory or second-hand sources and need checking before anyone builds on them. Master widened the scope three times (actions, GitHub Projects plus Drive, and the library as the lead section), so this runs past the 4,000-word target.

## 0. Summary of decisions

| Topic | Recommendation | Main reason |
|---|---|---|
| Library format | Floatt's library is a git repo that is also a **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json`, one plugin per pack) | It works in every Claude session, including ones Floatt didn't start, and comes with versioning, deps and namespacing |
| Activating packs | Per session, load a **kit** with `--plugin-dir` or the SDK's `plugins`/`agents`/`skills` options. Use user-scope install for packs you want everywhere. Never write to a repo's committed `.claude/` | Upstream repos stay clean |
| Driving Claude | **Agent SDK (TypeScript) in one Node/Bun sidecar**, pointed at the user's installed `claude` binary | Typed stream, `canUseTool`, in-process MCP and session APIs |
| Fallback | Rust spawns `claude -p --output-format stream-json --input-format stream-json` | No JS runtime to ship |
| Auth | Floatt never touches credentials. The user logs in to their own `claude`, or pastes an API key that Floatt stores in the keychain | Anthropic terms (§2.4) |
| Observing outside sessions | User-scope `http` hooks to Floatt's local server, the Floatt MCP server, `claude agents --json` | All documented. Transcript JSONL is not a stable format |
| Actions | Floatt MCP `register_action`. The user approves the exact argv in Floatt's UI, the definition is HMAC-signed, and a Rust runner executes it | Deterministic runs with no LLM in the loop |
| VS Code | **Control the user's VS Code** (`code` CLI and the `vscode://anthropic.claude-code/open` URI), embed **CodeMirror 6** for notes and diffs, and maybe add a small companion extension later | Cheapest option, keeps the real editor and stays local-first |
| Git | Shell out to system `git` from Rust | Full worktree support, same behaviour as the agents |
| GitHub | One rate-limited client in Rust, ETag/`since` polling, agents read through Floatt's cache | The user hit the 5,000/h limit today |
| Projects v2 | GraphQL polling gated on `project.updatedAt`, plus an outbox for writes. No webhooks in v1 | A desktop app can't receive webhooks |
| Backup | v1: encrypted snapshots to a folder the user picks (iCloud, Dropbox or Drive for Desktop works). v2: Drive API with `drive.file` | Least code, no OAuth |

---

## 1. Lead section: the library and the Claude Code wrapper

### 1.1 Store library items in Claude Code's own formats

Claude Code already has a packaging unit, the **plugin**. A plugin is a directory with `.claude-plugin/plugin.json` and any of `skills/<name>/SKILL.md`, `agents/*.md`, `commands/`, `hooks/hooks.json`, `.mcp.json`, `output-styles/`, `.lsp.json`, `monitors/` and `workflows/`. Claude Code namespaces every component under the plugin name, so agent `reviewer` in plugin `deploy-tools` becomes `deploy-tools:reviewer` ([manifest ref](https://code.claude.com/docs/en/plugins-reference)). A **marketplace** is a directory or git repo with `.claude-plugin/marketplace.json` that lists plugins by `source` ([marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)).

So **Floatt's library is a local git repo that is itself a marketplace**:

```
~/Floatt/library/                       # git repo; Floatt owns it
  .claude-plugin/marketplace.json       # name: "floatt"
  plugins/
    rn-expo-kit/                        # one pack = one plugin
      .claude-plugin/plugin.json        # name, version, dependencies, userConfig
      skills/expo-sandbox/SKILL.md
      agents/issue-worker.md            # frontmatter: tools, model, isolation: worktree
      commands/  hooks/hooks.json  .mcp.json  output-styles/
    oss-contributor/ ...
  kits/                                 # Floatt-only: session presets (see 1.4)
    oss-issue.kit.json
```

- **Index, don't duplicate.** Files on disk are the source of truth. Floatt's DB (Dexie today; see §4.4 for why the desktop app needs a Rust-side store) only indexes them: name, kind, description from frontmatter, tags, which projects use them.
- **Versioning** comes from git history plus each plugin's `version`. A tag such as `rn-expo-kit@1.3.0` is a release.
- **Validate** with `claude plugin validate <dir>` after every change ([marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)).
- **Sharing** takes no extra work: push the library repo, and anyone can run `claude plugin marketplace add owner/repo`. Plugin sources can be relative paths, `github`, `git-subdir`, `url`, `archive`, `npm` or `command`, so Floatt can also list third-party packs without copying them.

### 1.2 Enabling packs per session, per project or globally, without polluting repos

Four documented ways to put a pack in front of Claude, best first:

| Mechanism | What it writes | Works in sessions Floatt didn't start? | Use for |
|---|---|---|---|
| **Per-session load**: CLI `--plugin-dir <path>` (repeatable), `--agents <json>`, `--mcp-config`, `--settings <json>`, `--append-system-prompt-file`. SDK equivalents: `plugins: [{type:'local', path}]`, `agents`, `skills`, `mcpServers`, `settings`, `systemPrompt.append` | Nothing | No | **Kits.** This is the default |
| **User-scope install**: `claude plugin marketplace add ~/Floatt/library` then `claude plugin install x@floatt --scope user` | `enabledPlugins` in `~/.claude/settings.json` | Yes, in every project | Packs the user wants everywhere, such as the Floatt MCP connector |
| **Local scope**: `--scope local` | `.claude/settings.local.json`. Claude Code adds `**/.claude/settings.local.json` to the global git excludes on first write ([settings](https://code.claude.com/docs/en/settings)) | Yes, in that repo only | Per-project enablement in repos you don't own |
| Project scope: `--scope project` | `.claude/settings.json`, which is committed | Yes | **Only in repos the user owns** |

Rules for Floatt:
- A project in Floatt carries `owned: boolean`. For non-owned repos (upstream OSS, worktrees of forks) Floatt **never writes committed files**. It uses per-session flags or local scope. If a file really must exist on disk (say a worktree-only `CLAUDE.local.md`), Floatt adds it to that repo's `.git/info/exclude`, never to `.gitignore`.
- `settingSources` controls which filesystem config the SDK loads (`user`, `project`, `local`; omitted means all three). A **clean-room kit** uses `settingSources: []` plus explicit `plugins`/`agents`/`skills`. Managed settings, `~/.claude.json` and auto memory still load either way; turn memory off with `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` ([SDK config loading](https://code.claude.com/docs/en/agent-sdk/claude-code-features)).
- `--add-dir` loads only `.claude/skills/` from the added directory, not its agents or commands ([headless](https://code.claude.com/docs/en/headless)). Use `--plugin-dir` for full packs.
- The user's own workspace rule is "don't write to `~`". User-scope installs write `~/.claude/settings.json`, so Floatt must make that an explicit opt-in per pack.

### 1.3 Updates, pinning and conflicts

- **Pinning.** A marketplace can be pinned with `owner/repo#ref`, and a plugin `source` can pin a `ref` or `sha` ([install](https://code.claude.com/docs/en/plugins/install)). `plugin.json` `dependencies` accept `{name, marketplace, version}` constraints, and Claude Code reports unmet ones in `system/init.plugin_errors` ([headless](https://code.claude.com/docs/en/headless)).
- **Kit lockfile.** Each kit resolves to `kits/<kit>.lock.json`, recording each plugin's git sha and content hash. A session started from a kit records the lock in its run record, so you can replay what a session had.
- **Updates.** Floatt fetches remote packs, shows a per-pack diff (SKILL.md text, agent tools, hooks and MCP commands), and the user accepts. Changes to **hooks, MCP servers and `bin/` executables are flagged high-risk**, because they run code without the model in the loop.
- **Conflict detection.** Floatt computes it, since Claude Code won't. Namespacing removes most clashes between plugins. What remains is checkable statically:
  - an unnamespaced skill or agent in `~/.claude/` or the repo's `.claude/` with the same name as a kit item
  - two packs registering `PreToolUse` hooks on overlapping matchers, so ordering and deny-vs-allow need a look
  - MCP server name collisions, and two packs declaring the same tool namespace
  - contradictory permission rules (`allow Bash(git push *)` vs `deny`)
  - CLAUDE.md or `appendSystemPrompt` instructions that conflict (heuristic only; show them side by side)
  - For runtime truth, `query.initializationResult()`, `supportedAgents()`, `supportedCommands()` and `mcpServerStatus()` show what actually loaded.

### 1.4 Kits: starting a session with a chosen set

A kit is a Floatt JSON preset that compiles to SDK options, or to CLI flags for the fallback and for "open in terminal":

```ts
type Kit = {
  id: string; title: string;
  plugins: string[];                 // "rn-expo-kit@floatt" -> resolved to local paths
  agents?: Record<string, AgentDefinition>;   // inline extras
  skills?: string[] | 'all';
  mcpServers?: Record<string, McpServerConfig>;  // always includes Floatt's own
  settingSources?: ('user'|'project'|'local')[]; // default ['project','local'] in owned repos, [] in clean-room
  settings?: object;                 // permissions, hooks (flag-settings layer)
  appendSystemPrompt?: string;
  model?: string; effort?: 'low'|'medium'|'high'|'xhigh'|'max';
  permissionMode?: 'default'|'acceptEdits'|'plan'|'auto'|'dontAsk';
  maxBudgetUsd?: number;
};

function kitToOptions(k: Kit, cwd: string): Options {
  return {
    cwd, model: k.model, effort: k.effort, permissionMode: k.permissionMode,
    plugins: k.plugins.map(p => ({ type: 'local', path: resolvePlugin(p) })),
    agents: k.agents, skills: k.skills, settingSources: k.settingSources ?? [],
    mcpServers: { floatt: floattMcp, ...k.mcpServers },
    systemPrompt: { type: 'preset', preset: 'claude_code', append: k.appendSystemPrompt },
    maxBudgetUsd: k.maxBudgetUsd, canUseTool: floattApprovals, includePartialMessages: true,
    forwardSubagentText: true, agentProgressSummaries: true,
    pathToClaudeCodeExecutable: userClaudePath,
  };
}
```

For the orchestrator, the "master" kit holds the delegation instructions and an `issue-worker` agent with `isolation: worktree` in its frontmatter ([worktrees](https://code.claude.com/docs/en/worktrees)). Workers run as separate SDK sessions (one `query()` each, `cwd` = the worktree) rather than as in-process subagents, so each has its own approval queue and cost line. Claude Code's `WorktreeCreate` hook can override where worktrees are created (e.g. `worktrees/<repo>/<branch>/`), matching this workspace's layout ([hooks](https://code.claude.com/docs/en/hooks)).

### 1.5 How the wrapper UI shows what Claude is doing

Everything comes from the SDK's `SDKMessage` stream ([TS reference](https://code.claude.com/docs/en/agent-sdk/typescript)):

| UI element | Source |
|---|---|
| Live text | `stream_event` partials (`includePartialMessages: true`), then `assistant` messages |
| Tool call cards | `tool_use` blocks in `assistant.message.content`, matched to `tool_result` blocks in the next `user` message by `tool_use_id`. `tool_progress` messages give elapsed time |
| Subagent tree | `parent_tool_use_id` on every message (null = main thread), plus `task_started`, `task_progress`, `task_updated` and `task_notification`. `forwardSubagentText` gives the subagent's prose; `agentProgressSummaries` gives one-line summaries |
| Todo list | Inputs of `TodoWrite` and the `Task*` tools (`TaskCreate`/`TaskUpdate`), plus `TaskCreated`/`TaskCompleted` hooks **[unverified which one the main thread uses in this version; handle both]** |
| Diffs | `Edit`/`Write`/`MultiEdit` tool inputs for per-call diffs, then `git diff` in the worktree for ground truth. `enableFileCheckpointing` + `rewindFiles(userMessageId)` gives undo per turn |
| Approvals | `canUseTool(toolName, input, {suggestions, agentID, toolUseID})` turns into a Floatt modal or queue. Return `allow` (optionally with `updatedInput` or `updatedPermissions`) or `deny` |
| Questions | The `AskUserQuestion` tool goes through `canUseTool`; MCP elicitations arrive as `Elicitation` hook events |
| Cost and usage | `result.total_cost_usd`, `usage` and per-model `modelUsage`. Per-turn token counts from `assistant.message.usage` (dedupe by message id; see [cost tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking)). Figures are client-side estimates |
| Context meter | `query.getContextUsage()` or `assistant.context_usage` |
| Rate limits | `SDKRateLimitEvent`, `system/api_retry` |
| Hooks | `includeHookEvents: true` streams `hook_started`, `hook_progress` and `hook_response` |

Controls: `interrupt()` ends the turn cleanly, `setPermissionMode()` and `setModel()` work mid-session, `streamInput()` queues messages with `priority: 'now'|'next'|'later'`, `stopTask(id)` kills a background subagent, and `close()` ends the session.

### 1.6 Letting Claude write new skills and agents into the library, with review

- Floatt's MCP server offers a `library_propose` tool with input `{kind: 'skill'|'agent'|'command'|'output-style'|'hook'|'mcp', plugin, name, files: {path: content}}`. It writes to a branch `proposals/<id>` of the library repo, or to `library/.inbox/<id>/`, and never to `main`.
- Floatt runs `claude plugin validate`, then shows the proposal in a review pane (CodeMirror diff) with the frontmatter parsed into fields (tools, model, isolation). Any `hook`, `mcp` or executable is flagged as code execution. Approving merges the branch, bumps the plugin `version` and refreshes the index. Running sessions pick it up via `query.reloadPlugins()` / `reloadSkills()` or `/reload-plugins`.
- Mark the tool `_meta["anthropic/requiresUserInteraction"]: true`. Claude Code then prompts on every call even in `bypassPermissions` or `auto` mode ([MCP docs](https://code.claude.com/docs/en/mcp)). The real review still happens in Floatt.
- A "skill-author" agent in the library can carry the house style for SKILL.md (frontmatter, when-to-use triggers, short bodies).

---

## 2. Driving Claude Code from an app

### 2.1 Options compared

| | Agent SDK (TS) | Headless CLI stream-json | PTY-wrapped interactive CLI | IDE / Remote Control protocols |
|---|---|---|---|---|
| What it is | Library that spawns the Claude Code binary and speaks its control protocol over stdio ([overview](https://code.claude.com/docs/en/agent-sdk/overview)) | `claude -p --output-format stream-json --input-format stream-json --verbose [--include-partial-messages]` ([headless](https://code.claude.com/docs/en/headless)) | Run `claude` in a pseudo-terminal and render it with xterm.js | The IDE MCP server (VS Code extension ↔ CLI over `ws://127.0.0.1`, lock file `~/.claude/ide/<port>.lock`); Remote Control relays through the Anthropic API |
| Streaming | Typed `SDKMessage` union | The same JSON objects, untyped | Terminal bytes only | n/a |
| Approvals | `canUseTool` callback | `--permission-prompt-tool mcp__floatt__approve` (an MCP tool Floatt implements), or `PermissionRequest` hooks | User answers in the TUI | n/a |
| Hooks | In-process callbacks + filesystem hooks | Filesystem/`--settings` hooks only (`http` type pointed at Floatt) | Same | n/a |
| Custom tools | `createSdkMcpServer` in-process | External MCP via `--mcp-config` | Same | n/a |
| Sessions | `resume`, `forkSession`, `continue`, `sessionId`; `listSessions()`, `getSessionMessages()`, `renameSession()`, `tagSession()` | `--resume <id or path>`, `--continue`, `--fork-session`, `--session-id` | `--resume`, `claude attach <id>` | n/a |
| Cancellation | `AbortController`, `interrupt()`, `close()` | SIGINT ends the turn; SIGTERM exits 143 and leaves the turn unfinished | Ctrl-C bytes | n/a |
| Runtime needed | Node/Bun/Deno | None | None | n/a |
| Fit | **Best for a wrapper UI** | Good minimal fallback | Only for "give me the real terminal" | **Not usable as a third-party protocol.** The IDE MCP is internal RPC (only `getDiagnostics` and similar reach the model); Remote Control works only with claude.ai/mobile, needs a subscription, and has no documented API |

Notes:
- Python SDK: same capabilities, but Floatt is TypeScript, so skip it.
- `--bare` skips CLAUDE.md, hooks, plugins, MCP and memory, and will become the default for `-p` "in a future release" ([headless](https://code.claude.com/docs/en/headless)). Floatt should **always pass explicit flags** (`--plugin-dir`, `--mcp-config`, `--settings`) so a default change can't break it. Bare mode never reads OAuth, so it needs an API key.
- Sessions created by `-p` or the SDK are hidden from `claude --continue` and the picker but resumable by ID, from any directory since v2.1.223 ([sessions](https://code.claude.com/docs/en/sessions)).
- Claude Code's own **agent view** (`claude agents`, `claude --bg`, `claude attach|logs|stop <id>`) is a first-party supervisor for background sessions. `claude agents --json --all` is "the supported way to read session state from outside Claude Code" (`state`: working, blocked, done, failed, stopped; `waitingFor`) ([agent view](https://code.claude.com/docs/en/agent-view)). Floatt can list these alongside its own SDK sessions, and its "open in terminal" button can run `claude attach <id>` in a PTY.

### 2.2 Licensing, terms and auth (quoted, then interpreted)

- Agent SDK overview: *"Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods…"* The SDK is governed by the Commercial Terms ([overview](https://code.claude.com/docs/en/agent-sdk/overview)).
- Legal page: developers using the Agent SDK *"should use API key authentication… Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users… may not collect, store, or intermediate Claude.ai credentials"*. Also: *"Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription"*. Shipping or running Claude Code in a product requires the binary to be **unmodified**, with no auth methods removed, and each end user using their own credentials ([legal](https://code.claude.com/docs/en/legal-and-compliance)).
- Branding: you may say "Claude Agent" or "Powered by Claude"; you may not say "Claude Code" or use look-alike ASCII art in product naming.
- Pro/Max limits *"assume ordinary, individual usage of Claude Code and the Agent SDK"*. Many parallel agents will burn through them, so show `rate_limits` prominently.

What this means for Floatt **[interpretation, not legal advice]**:
1. Floatt has **no login UI** and never reads the keychain or token files.
2. **Mode A, "your Claude Code":** Floatt finds the user's installed, unmodified `claude` and passes it as `pathToClaudeCodeExecutable`. The user signs in through Anthropic's own flow (`claude` → `/login`). For the user's personal use this is the documented "end user signs in to the unmodified binary" case. Whether an SDK-driven Floatt build *distributed to others* may rely on this is unclear because the SDK note is stricter, so **ask Anthropic before advertising subscription use publicly**.
3. **Mode B, API key:** the user pastes a Console key. Floatt stores it in the OS keychain (`keyring` crate) and passes it as `ANTHROPIC_API_KEY` in the sidecar's `env`. This is the clearly sanctioned SDK path.
4. Don't bundle the Claude Code binary (the SDK's platform optional dependency) in Floatt's app bundle. Bundling it makes Floatt redistribute and re-sign Anthropic's binary (§3), and leaving it out sidesteps the "unmodified" question.

---

## 3. Running it from Tauri

### 3.1 Architecture

```
Webview (React, packages/app)
  │ invoke() + tauri::ipc::Channel<Event>   (streams, ordered, per session)
Rust core (src-tauri)
  ├─ SessionManager ── stdio JSON-RPC ──► sidecar "floatt-agent" (Node/Bun, Agent SDK)
  │                                         └─ N × query() → N × `claude` child processes
  ├─ Local HTTP server 127.0.0.1:<port> + token  (hooks, Floatt MCP over HTTP, VS Code companion)
  ├─ ActionRunner (§5), Git (§7), GitHub client (§7.3), Keychain
  └─ Store (SQLite / vault files) — source of truth for agent-facing data (§4.4)
```

- **One sidecar hosting many sessions**, not one per session. The Claude processes are already one per session, so a second Node per session only adds memory. The sidecar protocol is a small JSON-lines RPC: `start(kitId, cwd, prompt) → sessionId`, `send`, `interrupt`, `setMode`, `approve(requestId, decision)`, `close`, and events `{sessionId, msg}`.
- **Approvals cross three processes.** `canUseTool` in the sidecar emits `permission_request {requestId}`, then awaits a promise that Rust resolves when the user clicks. Pass the `signal` through so a cancelled turn closes the modal.
- **Streaming to the UI.** Use `tauri::ipc::Channel` per subscription (built for ordered streams) rather than global `emit`. Coalesce partial-text deltas to about 30 fps on the Rust side.
- **Cancellation.** UI → `interrupt()` (graceful) → `close()` → `abortController.abort()`. On app quit, Rust kills the sidecar's process group. The SDK ends Claude's stdin first, so pending prompts get cancelled cleanly ([headless](https://code.claude.com/docs/en/headless)).
- **Concurrency.** Each session is a full `claude` process. Budget roughly 150–400 MB RSS each **[unverified estimate]**. Cap concurrent workers (default 4) and queue the rest. `startup()`/`prewarm()` cut first-token latency for the next worker.

### 3.2 Sidecar packaging

| Option | Size | Notes |
|---|---|---|
| `bun build --compile` single binary | ~60–100 MB **[unverified]** | One file, `externalBin` with a target-triple suffix. The SDK's `executable` option supports `bun` |
| Node SEA / bundled `node` + JS | ~45–90 MB | More moving parts |
| Rust-only (`claude -p` stream-json) | 0 MB | Loses typed SDK, `canUseTool` (needs `--permission-prompt-tool` via MCP) and in-process MCP |

Tauri sidecars are declared under `bundle.externalBin` and spawned with `app.shell().sidecar()` (tauri-plugin-shell). Capabilities must allow only that sidecar name ([Tauri sidecar](https://v2.tauri.app/develop/sidecar/)). Floatt currently has only `opener` and `notification` plugins, so this adds `tauri-plugin-shell`.

**macOS signing and notarisation.** Since Tauri 1.5 the bundler signs every `externalBin` with the app's identity, and notarisation uses `notarytool` (`APPLE_API_KEY_PATH`, `APPLE_TEAM_ID`) ([Tauri 1.5 notes](https://v2.tauri.app/blog/tauri-1-5/)). A Bun-compiled binary needs hardened runtime with `com.apple.security.cs.allow-jit` (and probably `allow-unsigned-executable-memory`) entitlements to run JS **[unverified; test early]**. Not bundling `claude` avoids nested third-party Mach-O signing entirely.

**Auto-update.** `tauri-plugin-updater` updates the app and sidecar together. Claude Code updates itself, so record `system/init.claude_code_version` and the `capabilities` array and feature-detect on those, not on version strings ([headless](https://code.claude.com/docs/en/headless)).

**Web build.** The Next.js web app can't spawn processes. It stays a viewer and editor for tasks and notes. `Platform` gets an optional `agents?:` capability that only desktop implements, which fits the existing seam in `packages/app/src/platform/platform.type.ts`.

---

## 4. Using Claude Code's own extension points

### 4.1 Hooks: seeing sessions Floatt didn't start

Install one **user-scope** set of `http` hooks (opt-in, since it writes `~/.claude/settings.json`) that POST to Floatt's local server ([hooks](https://code.claude.com/docs/en/hooks)):

```json
{ "hooks": {
  "SessionStart":  [{ "hooks": [{ "type": "http", "url": "http://127.0.0.1:47123/hook", "headers": {"Authorization": "Bearer $FLOATT_TOKEN"}, "allowedEnvVars": ["FLOATT_TOKEN"], "timeout": 2 }]}],
  "PostToolUse":   [{ "matcher": "*", "hooks": [{ "type": "http", "url": "http://127.0.0.1:47123/hook", "async": true }]}],
  "Stop":          [ ... ], "SubagentStop": [ ... ], "Notification": [ ... ],
  "PermissionRequest": [ ... ], "SessionEnd": [ ... ], "WorktreeCreate": [ ... ]
}}
```

- Each hook input carries `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `permission_mode`, plus `agent_id`/`agent_type` inside subagents. That's enough to put every external session on Floatt's board.
- Useful events: `SessionStart` (inject context such as current task and recent action runs through `additionalContext`), `UserPromptSubmit`, `PreToolUse`/`PostToolUse`/`PostToolUseFailure`, `PermissionRequest` (Floatt can answer approvals for external sessions too), `Notification`, `Stop`/`SubagentStop`, `SubagentStart`, `TaskCreated`/`TaskCompleted`, `WorktreeCreate`/`WorktreeRemove`, `Elicitation`, `SessionEnd`.
- **Fail open.** If Floatt isn't running the HTTP call fails, and non-2 failures are non-blocking. Keep timeouts short and mark observational hooks `async: true`.
- Don't gate pushes with hooks that depend on Floatt being up. Use a `PreToolUse` deny rule on `Bash(git push *)` and `Bash(gh pr create *)` that a human-approval flow lifts per call.

### 4.2 Floatt as an MCP server for every session

- Transport: **HTTP on loopback** served by the running app (`claude mcp add --transport http --scope user floatt http://127.0.0.1:47123/mcp --header "Authorization: Bearer …"`). Inside SDK sessions use the same server, or an in-process `createSdkMcpServer` that proxies to Rust.
- Tools: `tasks_list/get/create/update`, `boards_*`, `notes_search/read/append`, `project_state`, `library_propose` (§1.6), `actions_*` (§5), `github_*` (cached reads, §7.3), `approve` (for `--permission-prompt-tool`).
- Resources: `floatt://project/<id>/notes/<slug>` and similar, so users can `@`-mention them. Prompts become slash commands ([MCP](https://code.claude.com/docs/en/mcp)).
- Tool search defers MCP tool definitions by default, so a large tool set costs little context. Write good server `instructions`. Use `_meta["anthropic/alwaysLoad"]` only for 2–3 core tools.
- Results over 50,000 characters get saved to a file unless the tool sets `_meta["anthropic/maxResultSizeChars"]`, so keep results small and paginate.

### 4.3 Statusline, output styles, transcripts, channels

- **Statusline** gets JSON on stdin (debounced 300 ms) with `session_id`, `cost.total_cost_usd`, `context_window.used_percentage`, `rate_limits.five_hour/seven_day.used_percentage` and `resets_at`, `workspace.git_worktree`, `pr.number`/`url`, `transcript_path` ([statusline](https://code.claude.com/docs/en/statusline)). A tiny statusline script can print a line *and* POST to Floatt. That's the cheapest way to get live **rate-limit and cost data for sessions Floatt didn't start**.
- **Output styles**: ship them in packs (`output-styles/`). Kits can pin one with `settings.outputStyle`.
- **Transcripts** live in `~/.claude/projects/<dir>/<session>.jsonl`, 30-day retention (`cleanupPeriodDays`). The docs say *"the entry format is internal… scripts that parse these files directly can break on any release"* ([sessions](https://code.claude.com/docs/en/sessions)). So use the SDK's `listSessions()` and `getSessionMessages()` for history and cost back-fill, and treat raw JSONL as best effort.
- **Channels** (research preview): an MCP server declaring `experimental['claude/channel']` can push `notifications/claude/channel` events into a running *interactive* session, and can relay permission prompts. Custom channels need `--dangerously-load-development-channels server:floatt`, and the flag is **ignored under `-p` and the SDK** ([channels ref](https://code.claude.com/docs/en/channels-reference)). Good for pushing into terminal sessions later. Not a v1 dependency.

### 4.4 An architectural consequence: the data store

Dexie/IndexedDB lives inside the webview. An MCP server, hook endpoint or action runner in Rust can't read it directly, and none of it exists in a closed or background app. For the command-centre features, move the desktop source of truth to the Rust side (SQLite via `tauri-plugin-sql` or `rusqlite`, plus a markdown vault folder for notes) and keep Dexie as a cache or for the web build. The alternative, Rust forwarding every MCP call to the webview over IPC, breaks whenever the window is closed. **This is the biggest structural change the plan implies.** Flag it to the user.

---

## 5. Actions: one-click buttons that Claude registers and Floatt runs

Goal: Claude registers "Switch app to #96 (port 8085)" once, and the user clicks it later with no LLM round trip.

### 5.1 MCP tools

`actions_register(def)`, `actions_update(id, def)`, `actions_remove(id)`, `actions_list(scope)`, `actions_runs(id?, since?)`. `register` and `update` only create a **proposal**. Nothing runs or becomes clickable until the user approves it in Floatt. All three mutating tools carry `_meta["anthropic/requiresUserInteraction"]: true`.

### 5.2 Schema

```ts
type ActionDef = {
  id: string;                       // assigned by Floatt
  title: string; description: string;
  scope: { projectId: string; worktree?: string };      // cwd must resolve inside this
  params?: Record<string, ParamSpec>;  // flat primitives only (same subset as MCP elicitation)
  runner:
    | { kind: 'exec'; argv: string[] }                // no shell; params fill whole argv slots: "{{port}}"
    | { kind: 'builtin'; step: BuiltinStep }          // typed, Floatt-implemented
    | { kind: 'sequence'; steps: Array<{ argv: string[] } | { builtin: BuiltinStep }> };
  env?: Record<string, string>;     // merged onto a minimal allowlisted env
  timeoutSec: number;               // default 60, max 3600
  safety: 'read' | 'local' | 'destructive' | 'external';   // claimed by Claude
  confirm: 'none' | 'click' | 'typed';
  expiresAt?: string;               // e.g. when the worktree is removed
  owner: { sessionId: string; agent?: string };
};
type ParamSpec = { type: 'string'|'integer'|'boolean'; enum?: string[]; pattern?: string; min?: number; max?: number; default?: unknown };
type BuiltinStep = { op: 'adb_reverse'; device?: string; from: number; to: number }
                 | { op: 'simctl_openurl'; url: string }
                 | { op: 'open_url'; url: string } | { op: 'open_in_vscode'; path: string };
```

The #96 example as a sequence: `adb reverse tcp:8081 tcp:8085`, then `xcrun simctl openurl booted "exp+<scheme>://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8085"` (URL format **[unverified for this app]**). Safety `local`, confirm `none`, `expiresAt` set to when the #96 worktree is removed.

### 5.3 Approval, classification and signing

1. **Floatt classifies; Claude only claims.** Floatt's effective safety level is `max(claimed, detected)`. Detection uses a denylist of argv heads and patterns: `rm`, `git push|reset --hard|clean|branch -D`, `gh` (any write), `curl -X POST|PUT|DELETE`, `kill`, `npm publish`, `sudo`, redirects to files, `sh -c`/`bash -c`, plus any cwd outside the scope. `destructive` forces `typed` confirm; `external` (network writes, pushes, PRs) forces `click` or stricter **always**, which keeps "human approval before push" intact.
2. **The approval card shows the exact argv per step**, with a resolved cwd, env diff and parameter constraints. Updates show a diff against the approved revision, and the old revision stays active until the new one is approved.
3. **Signing.** On approval Floatt stores `hmac_sha256(key, canonical_json(def))` with the key in the OS keychain. The runner refuses any definition whose MAC doesn't match, so an agent that edits the store or vault files directly can't change an approved action. Optionally record `approvedBy`/`approvedAt` in the run log.
4. Actions auto-expire with their worktree or project, or after N days unused, so the button list doesn't rot.

### 5.4 Runner (Rust, deterministic)

- `tokio::process::Command` with `argv` (never a shell unless `runner.kind === 'exec'` and argv[0] is an approved shell, which counts as `destructive`). `current_dir` must canonicalise inside the scope root. Start from `env_clear()`, then add `PATH`, `HOME` and `LANG` plus the declared env.
- New process group; on timeout or cancel, SIGTERM then SIGKILL after 3 s. Stream stdout and stderr into a ring buffer (cap ~1 MB) and to the UI via a Channel. Store the run record `{actionId, revision, params, startedAt, exitCode, durationMs, tail}`.
- Parameters are validated against `ParamSpec` and substituted only as whole argv elements, which rules out injection by construction.
- Optional later: macOS `sandbox-exec` profiles per safety level **[deprecated by Apple but still works; unverified on Darwin 27]**.

### 5.5 Feeding results back to Claude

| Path | Works for | Recommendation |
|---|---|---|
| SDK `streamInput()` a user message with `priority: 'later'` ("Action X ran, exit 0, tail: …") | Floatt-driven sessions | **Yes** |
| `UserPromptSubmit`/`SessionStart` hook returns `additionalContext` with runs since the last prompt | Any session with the user hooks | **Yes** |
| `actions_runs(since)` MCP tool | Any session | **Yes** (pull) |
| MCP resource `floatt://actions/runs` + `resources/subscribe` → `notifications/resources/updated` | Spec feature; Claude Code's support for resource *subscriptions* is undocumented (docs only mention `list_changed`) | **[unverified]** skip for now |
| Channel push into an interactive session | Dev flag only, ignored in SDK/`-p` | Later |

### 5.6 Relevant MCP features

- **`tools/list_changed`**: Claude Code refreshes tools when a server sends it ([MCP](https://code.claude.com/docs/en/mcp)). Floatt *could* expose approved actions as tools (`action_switch_96`) so Claude can trigger them too, but only `read`/`local` ones, and still through Floatt's runner.
- **Prompts**: they become slash commands, so a kit can ship `/floatt:standup`.
- **Elicitation** (form/url modes, spec 2025-11-25; Claude Code shows a dialog and supports both): fine for asking parameters, **never** for approvals, because an `Elicitation` hook can auto-answer it. Approval lives only in Floatt's UI.
- **MCP Apps** (`ui://` resources, `_meta.ui.resourceUri`, sandboxed iframe, postMessage JSON-RPC; spec `2026-01-26`): rendered by Claude, Claude Desktop, VS Code Copilot and others. Claude Code's CLI doesn't render them; UI resources are hidden from `@` suggestions ([MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview), [MCP](https://code.claude.com/docs/en/mcp)). Two uses: Floatt can ship an action-card MCP App so its buttons appear in Claude Desktop, and Floatt can *host* MCP Apps itself via `@mcp-ui/client`/AppBridge. Both are post-v1.

---

## 6. The VS Code part

| Option | Effort | UX | Licensing | Local-first | Verdict |
|---|---|---|---|---|---|
| a) Floatt as a VS Code extension (webview panels) | Medium; duplicates the Tauri shell | Lives only inside VS Code, one window per workspace, no global tray/notifications | Fine | Yes | No: loses the standalone command centre |
| b1) Embed CodeMirror 6 / Monaco | Low | Good for notes, small edits, diffs | MIT | Yes | **Yes, for notes and review** |
| b2) Embed openvscode-server / code-server in a webview | High: a Node server per workspace, ~hundreds of MB, extension host | Second VS Code that doesn't match the user's | MIT, but the Microsoft Marketplace terms limit it to Microsoft products, so it means Open VSX only **[from memory]** | Yes | No |
| c) Control the user's VS Code | Low | Real editor, real extensions, Claude Code extension already there | Fine | Yes | **Yes** |
| d) Hybrid: c + b1, and later a thin companion extension | Low → medium | Best | Fine | Yes | **Recommended** |

How (c) works:
- `code -n <worktree>` opens a window per worktree, `code -g file:line` jumps to a location, `code --diff a b` shows a diff.
- `vscode://anthropic.claude-code/open?prompt=<urlencoded>` opens a Claude Code tab in the focused VS Code window ([VS Code docs](https://code.claude.com/docs/en/vs-code)). Only `prompt` is documented, so a `cwd` parameter is **[unverified]**: open the worktree window first. `claude-cli://open?cwd=<abs>&q=<prompt>` opens a terminal session with the prompt pre-filled but unsent ([deep links](https://code.claude.com/docs/en/deep-links)).
- Sessions started in VS Code share `~/.claude/settings.json`, so Floatt's user-scope hooks, MCP server and plugins work there unchanged.

Later, a **companion extension** (~300 lines): a tree view of the project's tasks and actions, plus a status-bar item for the active session. It talks to Floatt over the same loopback HTTP and token, copying Claude Code's own pattern (random port, token in a `0600` lock file; see the [IDE MCP section](https://code.claude.com/docs/en/vs-code)). Don't build it until (c) feels limiting.

Editor choice for (b1): **CodeMirror 6** (small, modular, good markdown, `@codemirror/merge` for side-by-side diffs). Monaco is ~several MB and better suited to code-heavy editing. One editor stack is enough.

---

## 7. Git, worktrees and GitHub

### 7.1 Git engine

| | System `git` (shell out from Rust) | git2-rs (libgit2) | isomorphic-git |
|---|---|---|---|
| Worktrees | Full (`git worktree add/list/remove --porcelain`) | Worktree API present | No first-class `worktree add` **[unverified]** |
| Parity with agents/user | Identical (same hooks, credential helpers, signing, `.gitattributes`) | Diverges (no hooks, partial config) | Diverges more |
| Speed on big repos | Good | Good | Slow |
| Build cost | None | C dependency, static link | JS only |
| **Pick** | **Yes** | Maybe later for hot read paths | Web only, if ever |

Use porcelain v2 with `-z` for parsing (`git status --porcelain=v2 -z --branch`, `git diff --numstat -z`, `git log --format=%H%x00…`). Serialise writes per repository with a per-repo mutex; reads can run in parallel. Detect "base clone dirty" (the user's own `repos/*` rule) and surface it.

### 7.2 Diff rendering

- File lists and review: run `git diff` text through **react-diff-view** or `@git-diff-view/react` (GitHub-style, virtualised; react-diff-view is the older, maintained one) **[check bundle size]**.
- Single file, side by side with edits: `@codemirror/merge`.
- diff2html: simplest (HTML string), but not React-friendly for comments and selection.

### 7.3 GitHub under rate limits

The user hit the limit today. The likely cause is many agents each running `gh api`/`gh search`, which all share **one user budget** (5,000 points/h GraphQL and 5,000 req/h REST per user; the search API has its own small per-minute limit). Secondary limits: 100 concurrent requests, 2,000 GraphQL points/min, 80 content-creating requests/min ([GraphQL limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)).

1. **One client in Rust** for the whole app *and its agents*. Agents get `github_*` MCP tools that read Floatt's cache. A `PreToolUse` hook on `Bash(gh *)` blocks raw `gh` reads (or allow-lists a few) and tells Claude to use the MCP tool. This is the only way to actually enforce a shared budget.
2. **Local git first**: branch existence, commits ahead and merge state come from `git fetch` + `git log`, at no API cost.
3. **REST conditional requests**: send `If-None-Match` with the stored ETag. A `304` doesn't count against the primary limit when the request is authorised **[from memory; verify on the REST rate-limit page]**. Use `since=` on issue and comment lists, and `If-Modified-Since` + `X-Poll-Interval` on `/notifications`.
4. **GraphQL**: request only the fields you need, `first: ≤100`, and read `rateLimit {remaining resetAt}` in every query. Back off on `retry-after`, `x-ratelimit-remaining: 0`, or a secondary-limit 403.
5. **Budget governor**: a token bucket that reserves, say, 20% for user-initiated actions. Show the remaining budget in the UI.
6. **Show URLs instead of checking.** For "is there an open PR for #123?", render `https://github.com/<o>/<r>/pulls?q=is:pr+is:open+123` as a link rather than calling the search API. This repo's own `update-tasks.sh` already moved this way (commit `3fc26d6`).

---

## 8. GitHub Projects v2 two-way sync

**API.** Projects v2 is GraphQL-first: `ProjectV2`, `items` (`ProjectV2Item` with `content` = Issue / PR / DraftIssue), fields (`ProjectV2Field`, `ProjectV2SingleSelectField` with `options`, `ProjectV2IterationField` with `configuration.iterations`), and `fieldValues` (`…TextValue/NumberValue/DateValue/SingleSelectValue/IterationValue`). Mutations: `addProjectV2ItemById`, `addProjectV2DraftIssue`, `updateProjectV2ItemFieldValue` (value is one of `text`, `number`, `date`, `singleSelectOptionId`, `iterationId`), `clearProjectV2ItemFieldValue`, `updateProjectV2ItemPosition`, `archiveProjectV2Item`, `deleteProjectV2Item`. Scopes: `read:project` / `project` ([projects API](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)). Since Sept 2025 there is also a **REST API** for projects, items, fields and views ([changelog](https://github.blog/changelog/2025-09-11-a-rest-api-for-github-projects-sub-issues-improvements-and-more/)), which may allow ETag polling **[unverified whether these endpoints return ETags]**.

**Webhooks.** `projects_v2_item` (and `projects_v2`) webhooks exist for **organisation** webhooks and GitHub Apps. User-owned projects don't get them **[unverified; believed true]**. A desktop app can't receive webhooks without a public relay: smee.io is meant for development only; a small Cloudflare Worker could queue events for the app to long-poll. That means hosting something, which breaks "no backend". **Poll in v1.**

**Sync design (cheap polling):**
1. Every 2–5 minutes while a board is open, every 15 when idle: query `node(id: $project) { ... on ProjectV2 { updatedAt } }` plus `rateLimit` (1 point).
2. Only if `updatedAt` moved: page `items(first: 100)` with the field values you map, compare each item's `updatedAt` against the local copy, and upsert. About 1 point per 100 items, so a 500-item board costs ~5 points per changed sync.
3. Load fields and options once, refreshing on a schema change (an unknown option id shows up in item values).
4. **Writes go through an outbox**: local change → queued mutation → send (several mutations aliased into one document to save round trips) → mark synced on success. Each mutation costs 5 secondary-limit points, so stay well under 2,000/min.
5. **Conflicts**: field-level last-writer-wins on `updatedAt`. If the remote changed the same field after the local edit was queued, show a conflict chip rather than overwriting.
6. Map Floatt task to `DraftIssue` for local-only items. Linked issues and PRs stay owned by the repo: edit their title and body through issue mutations, not project ones.

**Auth.**

| | Fine-grained / classic PAT | OAuth App + device flow | GitHub App user token (device flow) |
|---|---|---|---|
| User-owned projects | Classic with `project` scope works; fine-grained support for user projects **[unverified]** | Yes (`project`, `repo`) | **[unverified]**: GitHub App permissions are oriented to org projects |
| Separate rate budget from the user's `gh` | No | No (user-attributed) **[believed]** | No for user tokens; installation tokens would be separate but need the app's private key, i.e. a server |
| Setup UX | Paste a token | "Enter code ABCD-1234 at github.com/login/device" | Same |
| **Pick** | Power-user fallback | **v1** | Revisit if org projects become the main case |

Store tokens in the OS keychain (`keyring` crate in Rust; the webview never sees them). Reusing `gh auth token` is possible but shares the same budget and couples Floatt to `gh`.

---

## 9. Google Drive backup

**Recommendation: build "back up to a folder" first, and add the Drive API second.**

**v1, folder backup.** The user picks a folder. If it sits in iCloud Drive, Dropbox or Google Drive for Desktop, the cloud copy comes free. Floatt writes **encrypted snapshot files** there on a schedule (daily, plus before migrations):
- Snapshot = SQLite `VACUUM INTO` copy (or Dexie JSON export) + vault folder → `tar` → zstd → encrypt (XChaCha20-Poly1305 via libsodium secretstream, or `age`). Key from a passphrase via Argon2id, kept in the keychain, with a printable recovery key.
- Name files `floatt-YYYYMMDD-HHMM.fbak`. Keep 7 daily, 4 weekly and 12 monthly snapshots (grandfather-father-son rotation).
- **Never point a sync client at a live database.** SQLite WAL files and IndexedDB folders corrupt under iCloud/Dropbox. Only plain markdown notes, written atomically (write to temp, then rename), are safe to sync live.
- Restore: pick a snapshot, decrypt, verify the hash, swap the data dir on next start.

**v2, Drive API** (for users without a sync client):
- Scope **`drive.file`** (non-sensitive; the app sees only files it created) and a visible "Floatt Backups" folder. Not `appDataFolder`: it's hidden from the user, deleted when the user removes the app from their Drive, and its files can't be trashed or moved ([appdata](https://developers.google.com/workspace/drive/api/guides/appdata), [scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)). Avoid full `drive` (restricted; needs a security assessment).
- OAuth: a "Desktop app" client, system browser via the existing opener plugin, a loopback redirect `http://127.0.0.1:<ephemeral>` with **PKCE**, and the refresh token in the keychain. The embedded client secret isn't confidential, which Google accepts for installed apps. While the OAuth consent screen is in "Testing" status, refresh tokens expire after 7 days, so publish the app (non-sensitive scopes need only basic verification) **[from memory]**.
- Upload with `files.create` using `uploadType=resumable` for anything over ~5 MB. Versions are separate files (simpler than Drive revisions, which expire unless `keepRevisionForever`, and that's capped per file **[from memory]**). Storage counts against the user's Drive quota; show the size before the first upload.
- Incremental: snapshots are small (tasks and notes are text), so full encrypted snapshots beat chunk-level dedupe until a vault passes ~100 MB. Add content-addressed chunks only then.

---

## 10. Open questions and things to verify first

1. Anthropic's position on an SDK-driven, publicly distributed Floatt using the user's own subscription login (§2.2). Ask before marketing it.
2. Bun-compiled sidecar entitlements under hardened runtime and notarisation (§3.2). Spike this in week 1.
3. Moving the desktop source of truth out of IndexedDB (§4.4). It's an architecture decision for the user.
4. Which todo tool the main thread uses in current Claude Code (`TodoWrite` vs `Task*`); render both.
5. Projects v2: webhooks for user-owned projects, fine-grained PAT and GitHub App access to user projects, ETags on the new REST endpoints.
6. Whether Claude Code honours MCP `resources/subscribe`.
7. `vscode://anthropic.claude-code/open` parameters beyond `prompt`.

## Sources

- Agent SDK overview, licensing and branding: https://code.claude.com/docs/en/agent-sdk/overview
- Agent SDK TypeScript reference: https://code.claude.com/docs/en/agent-sdk/typescript
- SDK config loading / settingSources: https://code.claude.com/docs/en/agent-sdk/claude-code-features
- SDK cost tracking: https://code.claude.com/docs/en/agent-sdk/cost-tracking
- Headless / programmatic CLI: https://code.claude.com/docs/en/headless
- Legal and compliance (auth, embedding): https://code.claude.com/docs/en/legal-and-compliance
- Hooks reference: https://code.claude.com/docs/en/hooks
- MCP in Claude Code: https://code.claude.com/docs/en/mcp
- Channels reference: https://code.claude.com/docs/en/channels-reference
- Sessions and transcripts: https://code.claude.com/docs/en/sessions
- Agent view: https://code.claude.com/docs/en/agent-view
- Worktrees: https://code.claude.com/docs/en/worktrees
- Statusline: https://code.claude.com/docs/en/statusline
- Settings: https://code.claude.com/docs/en/settings
- Plugins: https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/plugin-marketplaces, https://code.claude.com/docs/en/plugins/install
- VS Code extension and IDE MCP: https://code.claude.com/docs/en/vs-code
- Deep links: https://code.claude.com/docs/en/deep-links
- Remote Control: https://code.claude.com/docs/en/remote-control
- MCP Apps: https://modelcontextprotocol.io/extensions/apps/overview
- MCP elicitation (2025-11-25): https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- Tauri sidecars: https://v2.tauri.app/develop/sidecar/ ; signing notes: https://v2.tauri.app/blog/tauri-1-5/
- GitHub GraphQL limits: https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
- GitHub Projects API: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects ; REST for Projects: https://github.blog/changelog/2025-09-11-a-rest-api-for-github-projects-sub-issues-improvements-and-more/
- Google Drive appdata and scopes: https://developers.google.com/workspace/drive/api/guides/appdata , https://developers.google.com/workspace/drive/api/guides/api-specific-auth
