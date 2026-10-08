# A. Prior art and competitive landscape for Floatt as a Claude Code command centre

researcherA, 2026-10-08. Research only. Sources are linked inline. **[unverified]** marks claims I couldn't confirm from a primary source; **[local]** marks facts read from the user's own machine (`~/.claude`, `~/.ccr`, the `orca` CLI) or from shallow clones in `clones/`.

Scope grew four times while I worked (actions, Huly/GitHub Projects/Drive, the library as the lead topic, and the cross-project command centre), so this file runs longer than the 3,500 words first asked for. Sections follow master's priority order.

## 0. TL;DR

- The market for running agents in worktrees is crowded and has already **consolidated**. Vibe Kanban's company shut down (Apr 2026), Crystal was deprecated (Feb 2026), and Roo Code was archived (May 2026). Anthropic's own Claude Code Desktop now ships parallel worktree sessions, diff comments, CI auto-fix, a phone Dispatch, and **Projects**, a coordinator conversation that spawns worker threads and has an Overview showing "Waiting on you" and "Ready for review". **That is the user's master/agent pattern, built in, cloud-first.** Floatt can't win as just another worktree runner.
- What nobody does well: (1) a **curated, conflict-checked library** of skills, agents, hooks and MCP servers that you turn on per project; (2) **one personal board across many projects** that holds code *and* non-code work; (3) **actions that agents register and the user runs** with no LLM round trip; (4) **local-first state** you can read and back up as files; (5) **human gates** that are first-class objects, not chat messages.
- Packaging: **don't invent a format.** Build on Claude Code plugins (`marketplace.json`, `plugin.json`, SKILL.md under the open Agent Skills standard). Add a small Floatt sidecar for UI-only things (actions, board templates, workflows).

---

## 1. Lead section: the library of skills, agents, tools and instructions

### 1.1 What exists

| Collection | Curation | Versioning | Install | Scope | Conflict handling | Discovery |
|---|---|---|---|---|---|---|
| **Claude Code plugins and marketplaces** ([docs](https://code.claude.com/docs/en/plugin-marketplaces)) | Marketplace owner. The official one is curated by Anthropic | Git `ref`/`sha` pin per entry; `version` in `plugin.json`; cache per version | `/plugin install x@market`, `claude plugin install` | user, project, local, managed (org) | Plugin skills are **namespaced** (`/plugin:skill`), so names can't collide; reserved marketplace names | `/plugin` Discover tab; **relevance signals** (`cwd`, `cli`, `filesRead`, `manifestDeps`) pin a plugin as "suggested for this directory", with rate-limited tips ([docs](https://code.claude.com/docs/en/plugins/relevance)) |
| **Official marketplace** `anthropics/claude-plugins-official` **[local]** | Anthropic + partners | 315 entries, mostly `url`/`git-subdir` sources pinned to `ref`+`sha`; a `renames` map | same | same | same | categories: development 123, productivity 69, database 39, monitoring 22, security 18, deployment 9, design 8 |
| **Community marketplace** `anthropics/claude-plugins-community` **[local]** | Light | same | same | same | same | 2,282 entries. Volume with little curation |
| **Skills** (SKILL.md, [docs](https://code.claude.com/docs/en/skills)), [Agent Skills open standard](https://vercel.com/blog/introducing-skills), [skills.sh](https://qaskills.sh/blog/skills-sh-agent-skills-directory-guide) | Author; skills.sh adds a leaderboard by installs | None built in (git) | copy into `~/.claude/skills`, or `npx skills add` (installs into about 17 harnesses) | enterprise > personal > project > nested > plugin | **Same name: enterprise > personal > project wins.** No detection of overlapping *descriptions* or triggers | Progressive disclosure: about 100 tokens of metadata per skill is always loaded, and the body only on trigger |
| **awesome-claude-code** ([contributing](https://www.mintlify.com/hesreallyhim/awesome-claude-code/contributing)) | Issue-form submission; "only Claude submits PRs" (automated triage against criteria: relevant, documented, maintained, licensed) | n/a, a list | manual | n/a | n/a | One long README by category |
| **claude-code-templates / aitmpl.com** ([docs](https://docs.aitmpl.com/components/overview)) | One maintainer plus PRs | npm `@latest` | `npx claude-code-templates --agent x --command y --hook z --mcp w` | writes into project `.claude/` | none; files overwrite | Web browser with search and preview. Claims 400+ agents, 225+ commands, 65+ MCPs, 39+ hooks, 60+ settings, 14 templates |
| **wshobson/agents** ([deep dive](https://www.heyuan110.com/posts/ai/2026-04-20-wshobson-agents-deep-dive/)) | One maintainer | git | as a plugin marketplace | plugin | namespaced; each agent pins a model tier (Haiku/Sonnet/Opus) | about 88 plugins and 190+ agents grouped by domain |
| **SuperClaude** ([guide](https://lumadock.com/tutorials/superclaude-framework)) | Small team | PyPI | `pipx install superclaude && superclaude install`, `superclaude doctor` | user | Prefix `/sc:`; a "framework" that injects behaviour | About 30 `/sc:*` commands, 20 persona agents, 7 modes |
| **BMAD Method v6** ([install](https://www.mintlify.com/bmad-code-org/BMAD-METHOD/installation)) | Core team plus modules | npm | `npx bmad-method install` generates config **per IDE** (Claude Code, Cursor, Copilot, Windsurf) | project | "Update-safe customization": user overrides survive upgrades | Modules, persona agents, workflow engine |
| **GSD (get-shit-done)** ([overview](https://pasqualepillitteri.it/en/news/169/gsd-framework-claude-code-ai-development)) | One author; moved to `open-gsd/gsd-core` | npm | `npx get-shit-done-cc` | user (`~/.claude/commands/gsd/`, 57 commands **[local]**) | Prefix `gsd:` | Pitch: fresh-context subagents per phase to beat "context rot" |
| **CCR** (user's org pack) **[local]** | Org repo | git clone to `~/.ccr`; projects pin a CCR commit in `.ccr-project.yaml` | `install.sh` **symlinks** 31 commands into `~/.claude/commands` | user, plus per-project CLAUDE.md generated by `/ccr-init` | "Delegation mode": wraps GSD, BMAD and Superpowers and applies "overlays" on top. A pack of packs | 37 commands, 14 upstream sources |
| **ponytail** **[local]** | One author | `plugin.json` 4.9.0 | plugin | user | **Hooks inject a "PONYTAIL MODE ACTIVE" block into every session and every subagent** (`ponytail-subagent.js`) | One package ships `.cursor`, `.windsurf`, `.opencode`, `gemini-extension.json`, `.devin-plugin`, `.qoder` |
| **Cursor rules** ([guide](https://morphllm.com/cursor-mdc-rules)) | Per repo; cursor.directory community | git | `.cursor/rules/*.mdc` | project | Four activation modes: `alwaysApply`, glob auto-attach, agent-requested (description), manual `@rule` | cursor.directory |
| **Roo Code marketplace** ([docs](https://docs.roocode.com/features/marketplace)) (archived May 2026) / **Cline rules** | Vendor-curated | n/a | in-extension | **project or global per item** (`.roomodes`) | modes are exclusive (one active) | In-app marketplace for modes and MCPs |
| **MCP registries**: [official](https://modelcontextprotocol.info/tools/registry/), Smithery, Glama, mcp.so | Official: verified reverse-DNS namespace in `server.json` (blocks impersonation, not bad code). Others: popularity, reviews | `server.json` versions | client-specific | n/a | Tool-name clashes are left to the client | Official is an API for aggregators; Smithery and Glama have the search UX |

### 1.2 What the user's own setup shows **[local]**

- **Overlapping triggers.** "plan this" matches the `plan` skill, `ccr-plan` and `gsd:plan-phase`. "continue / what's next" matches `plan`, `ccr-next`, `ccr-resume`, `gsd:next` and `gsd:resume-work`. "debug this" matches `ccr-debug` and `gsd:debug`. Claude Code resolves only **identical names**, never overlapping descriptions, so the model picks one, and the pick can differ from run to run.
- **Hooks with global reach.** Ponytail's SubagentStart hook injected "lazy senior developer" coding rules into *this research agent*. Nobody can see what a hook injects until it bites.
- **Version drift across scopes.** `expo@claude-plugins-official` is installed four times: user 1.13.6, and projects at 1.2.0 and 1.13.6. `kitten-bot` is copy-pasted into five projects' `.claude/skills`.
- **Listing cost.** Roughly 100 slash commands from CCR and GSD alone, plus about 90 other skills. Each one's metadata costs context in every session.
- **Packs of packs.** CCR re-wraps GSD, BMAD and Superpowers. When the upstreams update, the overlays can silently contradict them.

### 1.3 Patterns that work

- **Namespacing** (`plugin:skill`) plus a **git `sha` pin** per entry: reproducible, and no collisions on name.
- **Progressive disclosure** (SKILL.md): a large library is affordable because only descriptions are always loaded.
- **Scope ladder** (managed > user > project > local) and per-project `enabledPlugins` in `.claude/settings.json`, so a team commits its pack choices.
- **Relevance-based suggestions** (cwd, CLI, manifest deps), rate-limited and never auto-installed.
- **Multi-harness packaging** (ponytail, BMAD, skills.sh): one source, many agents.
- **Invocation control**: `disable-model-invocation: true` for side-effecting skills (deploy, commit), `user-invocable: false` for background knowledge, `allowed-tools` grants for that turn only, and `context: fork` to isolate heavy skills.

### 1.4 Gaps

- No tool **detects conflicts by meaning**: overlapping descriptions, contradicting CLAUDE.md rules, two hooks writing on the same event, or two packs both claiming "planning".
- No **cost view**: tokens each pack adds to every session, and to every subagent.
- No **quality signal** beyond stars and installs: no evals, no "last tested with Claude Code vX", no breakage reports.
- No **workflow composition** UI: chaining skills into a pipeline (discover, then plan, then execute, then review) is left to mega-packs like CCR or GSD, which bundle everything.
- Discovery is a **flat list**, either a long README or a 2,282-entry marketplace.

### 1.5 What Floatt's library should be

**Format (keep it lazy).**
- A Floatt pack **is** a Claude Code plugin, so it works with no Floatt at all.
- It adds one optional sidecar, `floatt.json`, holding only what Claude Code doesn't know about:
  - `actions[]` (section 4)
  - `boardTemplates[]` (columns mapped to skills)
  - `workflows[]` (skill chains with gates)
  - `conflictsWith[]` / `replaces[]` hints
  - `cost` (measured tokens)
- The Floatt library itself is a git repo with a `marketplace.json`, which can also be added with plain `claude plugin marketplace add`.

**Curation tiers.**
1. **Core**: maintained by Floatt, evaluated, pinned.
2. **Verified**: third party, `sha`-pinned, passes the conflict lint and a smoke eval.
3. **Community**: links out to the official, community, skills.sh and MCP registries, labelled clearly as unvetted.

**Categories** (by job, not by type): Plan, Build, Review, Test/QA, Ship (commit/PR/changeset), Debug, Docs, Design/UI, Data/DB, Mobile (Expo), Infra, Orchestration (master/agent, worktrees), Productivity (notes, standups, inbox), Safety (permissions review, security review), Output styles.

**Recommended starter set** (from what the user already relies on):
- `new-worktree` + `master-agent` + `orchestration` (the workspace pattern)
- `commit` + `github-contributor` + `changeset` (human-gated shipping)
- `code-review` / `security-review` / `simplify`
- `plan` (one planning skill only, see the conflict lint below)
- `frontend-design`
- `expo` plugin (per project, not user scope)
- `mcp-server-dev`, plus one LSP plugin per language
- ponytail as an **opt-in per project**, not global

**UX.**
- **Per-project toggle grid.** Rows are packs; columns are On, Scope, Version, Token cost, Conflicts. Floatt writes `enabledPlugins` into that project's `.claude/settings.json`, so Claude Code itself enforces it.
- **Conflict lint** before enable:
  - same-name shadowing (by precedence)
  - description overlap: embedding similarity, or simple keyword overlap of trigger phrases
  - multiple hooks on the same event, flagging any that inject into subagents
  - CLAUDE.md rules that contradict each other: an LLM pass, run once at enable time, never per session
  - It then offers "keep A, disable B's skill X" rather than all-or-nothing.
- **Profiles**: "OSS contribution", "Expo app", "Writing". One click applies a set of packs to a project.
- **Suggested for this project**: reuse the Claude Code relevance-signal format, so the same `marketplace.json` drives both.
- **Workflow builder**: drag skills onto board columns (e.g. Todo, Plan with `plan`, Build with an agent, Review with `code-review`, Ship with a gate plus `commit`/`github-contributor`). Moving a card runs the column's skill.
- **Pack health**: last-updated date, pinned `sha`, tested against Claude Code version X, local usage counts, "broke for me" reports. Update with a diff preview of changed instructions, because instruction changes are behaviour changes.

---

## 2. Agent wrappers and orchestrators

### 2.1 Comparison table

| Tool | Licence / open | Isolation | Drives agent via | State | Review / gate | Many tasks and repos UX |
|---|---|---|---|---|---|---|
| Claude Code Desktop + web | proprietary | worktree per session (`<repo>/.claude/worktrees`), cloud VM, SSH | native | Anthropic cloud + local | diff line comments, `/code-review` card, CI bar with auto-fix and auto-merge, archive approval card | sidebar of sessions, Projects Overview, Dispatch push notifications, cross-session messaging |
| Conductor | closed **[unverified]**, free | worktree in `~/conductor/workspaces/<repo>/<ws>` | Claude Code, Codex, Cursor, OpenCode **[mechanism unverified]** | local app | diff viewer, checks, PR, merge, archive | workspace list per repo |
| Orca (stablyai) | MIT | worktree, SSH remote | any CLI in a PTY (40+ agents) | local + session restore | annotated diffs, GitHub/Linear/Jira drawers | `worktree ps`, orchestration inbox, decision gates, mobile app |
| Vibe Kanban | Apache-2.0, community-run | worktree | `claude -p` stream-json in/out + `--permission-prompt-tool=stdio` **[local code]** | SQLite in OS app-data | inline diff comments, then PR | kanban board per project |
| Crystal → Nimbalyst | MIT | worktree | node-pty + stream-json **[local code]** | SQLite `~/.crystal` | diff, squash/commit | session list → session kanban, iOS app |
| Claude Squad | AGPL-3.0 | worktree + tmux | tmux PTY | `~/.claude-squad/config.json` | diff tab, then checkout/push | TUI list |
| opcode (Claudia) | AGPL-3.0 | none (sessions) | spawns `claude --output-format stream-json` **[local code]** | SQLite + reads `~/.claude/projects` | checkpoints/timeline | project browser, usage dashboard |
| Sculptor (Imbue) | proprietary ("not quite open source yet") | Docker container per agent | Claude Code inside the container | containers | Pairing Mode syncs to the local IDE; AI "Suggestions" | agent list |
| Cursor | proprietary | cloud VM, or local worktrees (up to 8) | own agent | cloud | PR, video recordings | Agents Window |
| Copilot coding agent | proprietary | GitHub Actions runner | own agent | GitHub | draft PR; the assigner can't approve | GitHub issues, Jira, Linear |
| OpenAI Codex | CLI Apache-2.0; app proprietary | Local, Worktree or Cloud per thread | own | local + cloud | **review queue** | app as "command center", automations |
| Cline (+ Kanban) | Apache-2.0 | worktree per card | own + Claude Code/Codex | local | inline diff comments, then Commit/Open PR | board with **dependency chains** |
| Zed | editor GPL **[unverified]**; ACP open | none (threads) | **ACP** (Agent Client Protocol) | local | editor diff | Threads sidebar grouped by project |
| Superset / Emdash / Kanban Code / KAGAN | Apache / MIT / Apache / ? | worktree | PTY | local | diff, PR, CI | workspace list or kanban; Emdash pulls Linear/Jira/GitHub tickets |

### 2.2 Per tool

**Anthropic Claude Code Desktop and claude.ai/code** ([desktop docs](https://code.claude.com/docs/en/desktop), [Projects](https://code.claude.com/docs/en/claude-projects))
- Core model:
  - Code tab sessions, each optionally in its own worktree.
  - Drag-and-drop panes holding terminal, file editor, browser preview and diff.
  - Side chats (`Cmd+;`) for questions that stay out of the main thread.
- Multi-session UX:
  - **Cross-session messaging**: "tell the payments session the schema changed".
  - **Task chips**: Claude proposes out-of-scope work, and one click starts a new worktree session.
  - **Auto-archive** when the PR merges.
  - **Remote Control** shows local sessions on phone and web.
  - **Dispatch** starts sessions from the phone and pushes a notification when one needs approval.
- **Projects (beta)**: one coordinator conversation plus worker threads (cloud by default, optionally on your machine). The Overview tabs are Waiting on you, Pull requests, Library and Routines. Project instructions and memory flow down to the threads.
- Gates:
  - Permission modes: Manual, Accept edits, Plan, Auto (classifier), Bypass.
  - Archiving always asks, even in Auto.
  - CI auto-fix and auto-merge are opt-in.
- Standout: **`.claude/launch.json`**, where Claude writes the dev-server config once and preview reuses it (prior art for registered actions).
- Pain points:
  - Worktrees pile up on disk (Desktop now shows a disk panel) ([wmedia](https://wmedia.es/en/tips/claude-code-worktrees-desktop-disk)).
  - `/bg` worktrees lack `node_modules`, so hooks fail with MODULE_NOT_FOUND ([issue mirror](https://claudeissues.com/issue/59341-agent-view-bg-worktrees-dont-inherit-node-modules-hooks-fail-with-module-not-fou)).
  - The default worktree inside the repo breaks React Native/Metro ([issue mirror](https://claudeissues.com/issue/34458-bug-default-worktree-location-inside-repo-causes-major-problems-for-react-native)).
  - Cross-session listing only sees Desktop-run sessions, not CLI or VS Code ones.
  - Projects need GitHub.com plus the Claude GitHub App, and burn plan limits faster.
- CLI side: native worktrees landed in v2.1.49 (Feb 2026) ([verdent](https://www.verdent.ai/guides/claude-code-worktree-setup-guide)); `claude --bg`, `claude agents` (Agent View), `/teleport`, `/remote-control` ([claudelog](https://claudelog.com/faqs/what-is-remote-control-in-claude-code/)); experimental **Agent Teams** with a shared task list and mailbox ([morph](https://www.morphllm.com/claude-code-agent-teams)).

**Conductor** ([site](https://www.conductor.build), [worktrees doc](https://www.conductor.build/docs/concepts/git-worktrees))
- Mac app by Melty Labs (YC), free, Apple Silicon only, v0.90.
- Each task is a workspace (branch, files, terminal, diff, review path).
- Repo settings cover "files to copy" (`.worktreeinclude`-style patterns), setup and run scripts, and checks.
- Lifecycle: PR, merge, archive. Agents: Claude Code, Codex, Cursor, OpenCode. "Conductor Cloud" was announced.
- Pain points: per-worktree setup cost; port clashes; one branch per worktree.

**Orca** ([repo](https://github.com/stablyai/orca), [CLI docs](https://www.onorca.dev/docs/cli/overview)). The user already has its CLI **[local]**.
- Electron, MIT, by Stably AI (YC). The README reports 87.8k stars, which looks inflated **[unverified]**.
- Model: "if it runs in a terminal, it runs in Orca". Worktrees with parent/child links, WebGL terminals whose scrollback survives restarts, fan one prompt out to several agents and compare.
- Extras: Design Mode (click a UI element to send its HTML/CSS/screenshot into the prompt), GitHub/Linear/Jira drawers, iOS and Android companions.
- CLI **[local]**:
  - `orca orchestration` with runs, `task-create`/`task-update`, `dispatch`, `send`/`check`/`reply`/`inbox`, `ask` (blocks until answered), `gate-create`/`gate-resolve`, and supervised workers.
  - `orca automations` (scheduled), `orca account add` (managed Claude/Codex accounts), `worktree ps` (summary across worktrees), `artifacts share`.
  - This is the closest existing match to the user's master/agent model, with **first-class decision gates**.

**Vibe Kanban** ([repo](https://github.com/BloopAI/vibe-kanban), [shutdown post](https://vibekanban.com/blog/shutdown))
- Board (To Do → In Progress → Review → Done); each attempt is a worktree with terminal and dev server; 10+ agents supported.
- **[local code]**:
  - Runs `claude` with `--input-format=stream-json --output-format=stream-json --permission-prompt-tool=stdio`, answers `can_use_tool` control requests from its UI (approve or deny, plus "always allow" rule suggestions), and supports plan mode.
  - Ships an **MCP server** so agents can list and create issues, workspaces and sessions themselves.
  - Rust backend, SQLite in the OS app-data folder, and now a `tauri-app` crate.
- Shutdown: bloop shut down on 10 Apr 2026 because "the vast majority are free users". Cloud issues, comments and orgs were removed; local workspaces live on. The repo is still active (commit 19 Sep 2026).
- The lesson they drew: engineers now spend their time on **planning and review**.

**Crystal → Nimbalyst** ([Crystal](https://github.com/stravu/crystal), [Nimbalyst review](https://rywalker.com/research/nimbalyst))
- Crystal: Electron, MIT, about 3.1k stars; node-pty plus stream-json, better-sqlite3, logs in `~/.crystal` **[local code]**. Deprecated Feb 2026.
- Nimbalyst keeps worktrees and adds:
  - a **session kanban that moves cards automatically** (In Progress → Waiting → Review)
  - WYSIWYG markdown, mockup, Mermaid and Excalidraw editors with *visual* red/green diffs
  - a task tracker ("Linear for coding agents") and an iOS approval app
- Open-sourced under MIT in Apr 2026.
- Weaknesses: small community, Electron footprint.

**Claude Squad** ([repo](https://github.com/smtg-ai/claude-squad))
- Go TUI over tmux plus worktrees, AGPL-3.0, about 8.6k stars.
- Experimental `autoyes`; pause (commits, then frees the branch), resume, push.
- Pain points: tmux dependency, no structured state, auto-accept is all-or-nothing.

**opcode (formerly Claudia)** ([repo](https://github.com/winfunc/opcode))
- Tauri 2 + React, AGPL-3.0, about 22k stars. The same stack as Floatt.
- Reads `~/.claude/projects` for history; custom "CC Agents"; checkpoints/timeline; usage and cost dashboard; MCP manager; CLAUDE.md editor.
- Activity: the last commit is a README edit (Sep 2026) and binaries are "coming soon" **[local]**, so it looks stalled.
- Lesson: a pretty viewer over `~/.claude` isn't enough to stay maintained.

**Sculptor (Imbue)** ([docs](https://docs.imbue.com/features/pairing-mode), [review](https://rywalker.com/research/sculptor), [HN](https://hn.svelte.dev/item/45427697))
- A Docker container per agent, built from devcontainer.json.
- **Pairing Mode** uses Mutagen to sync the container into your local checkout, with auto-stash.
- Merge-conflict detection and AI Suggestions.
- HN pain points: heavy (Postgres per agent), "cognitive overload of agent multiplexing", Claude-only, and "free in beta, then what?"

**Cursor** ([guide](https://www.morphllm.com/cursor-background-agents))
- Background and cloud agents run in VMs, open PRs and (since Feb 2026) record video of their computer use.
- Up to 8 local parallel agents in worktrees; Cursor 3 adds an Agents Window.
- Proprietary; team-oriented.

**GitHub Copilot coding agent** ([MS Learn](https://learn.microsoft.com/en-us/training/modules/github-copilot-code-agent/3-assign-track-troubleshoot-copilot-code-agent-tasks))
- Assign an issue, and it reacts 👀, creates a `copilot/` branch and a draft PR with a live plan, and runs in Actions.
- **The assigner can't approve the PR.** Jira and Linear assignment are supported ([changelog](https://github.blog/changelog/2026-03-06-github-copilot-coding-agent-for-jira-is-now-in-public-preview/)).
- Pain points: slow loop through Actions; GitHub only.

**OpenAI Codex** ([app guide](https://intuitionlabs.ai/articles/openai-codex-app-ai-coding-agents), [automations](https://codex.danielvaughan.com/2026/04/08/codex-desktop-automations/))
- App launched 2 Feb 2026 (Mac), Windows on 4 Mar 2026.
- Each thread picks Local, Worktree or Cloud; skills; **Automations** run on a schedule and drop results into a **review queue**.
- CLI is Apache-2.0.

**Cline / Roo Code**
- Cline is Apache-2.0: Plan/Act, checkpoints, `.clinerules`.
- **Cline Kanban** (Mar 2026): a worktree and terminal per card, **task dependency chains** (B starts when A finishes), inline diff comments, Commit or Open PR ([TestingCatalog](https://www.testingcatalog.com/cline-debuts-kanban-for-local-parallel-cli-coding-agents/)).
- Roo Code was **archived 15 May 2026** as its team moved to cloud "Roomote". Its reason: IDE extensions are stuck with "single-user sessions" ([frontman](https://frontman.sh/blog/roo-code-vs-cline/)).

**Zed** ([1.0](https://noqta.tn/en/news/zed-editor-1-0-stable-rust-ai-coding-2026), [terminal threads](https://zed.dev/blog/terminal-threads))
- 1.0 shipped 29 Apr 2026.
- **ACP** is an open protocol for plugging any agent into an editor.
- Threads sidebar grouped by project (`⌥⌘J`); terminal threads make any CLI agent a managed thread.

**Newer tools (2025-26)**
- **Superset** (Apache-2.0, YC P26). From [HN](https://hn.svelte.dev/item/48236770): 2 GB RAM, port assumptions, and "the hard part is… managing all the state around them".
- **Emdash** (MIT, YC W26): 22 CLIs, tickets from Linear/Jira/GitHub, kanban, CI view ([morph](https://www.morphllm.com/emdash-ai-coding-agent)).
- **Kanban Code** (Apache-2.0, native macOS) ([repo](https://github.com/langwatch/kanban-code)):
  - A *reconciler* (not a poller) links Claude session, worktree, tmux and PR into one card.
  - Hook-based activity detection, BM25 search over session history, push notifications to phone and Watch.
- **KAGAN**: a keyboard-first kanban TUI.

### 2.3 Recurring pain points (all tools)

1. **Review is the bottleneck**, not generation. Diff fatigue and too many PRs.
2. **Worktree setup**: missing `node_modules` and `.env`, slow installs, disk use, Metro and Watchman confusion when the worktree sits inside the repo.
3. **Shared resources**: ports, local databases, emulators. This is the user's "#96 Metro on port 8085" problem.
4. **Attention routing**: which of 8 agents is waiting on me?
5. **Weak business models**: Vibe Kanban, Crystal and Roo all died or pivoted, and opcode stalled. Local-first and free projects need a sustainable scope.
6. **Platform gaps** (Mac-only, Apple-Silicon-only) and **heavy Electron** footprints.

---

## 3. Running many tasks across many projects: UX patterns

How each tool handles it:
- Claude Desktop has a sidebar (20 most recent), Projects Overview with **Waiting on you**, and push notifications.
- Orca has `worktree ps`, an orchestration **inbox**, and `gate-list`.
- Nimbalyst and Kanban Code use **auto-moving columns** (In Progress, Waiting, Review).
- Zed groups threads **by project**.
- Codex uses a **review queue**.
- Conductor and Superset group workspaces under each repo.
- Copilot and Emdash start from the **issue tracker**.

Patterns Floatt should adopt:
1. **Attention inbox across all projects.** One list of things that need the human: permission prompts, decision gates, "ready for review", CI failed, a question from an agent. Sort by age; clear each item with a keyboard action (approve, deny, reply, open diff).
2. **Cards move themselves.** Columns are driven by state: hook events (Stop, Notification, PermissionRequest) and git/PR state. Kanban Code's reconciler model beats polling.
3. **Status tied to the card.** Every card shows a live chip (running, waiting, blocked on gate, CI red, PR open, merged), with the session, worktree, branch, PR and draft folder linked to it, as Kanban Code does with its `links.json`.
4. **Project switcher plus a home view across projects.** `Cmd+K` jumps to any project, task or session, as in Huly and Linear. Home is "Today": inbox, running agents, due tasks and calendar blocks.
5. **Grouping**: by project (Zed), by person/agent (Orca `ps`), by state (Projects Overview). Saved views.
6. **Budgets and resources panel**: plan and rate-limit usage (Orca tracks rate limits), plus ports and emulators claimed by which worktree.
7. **Notifications by policy**: push only for gates and failures, batch the rest into a digest (as Dispatch and Kanban Code do).
8. **Side chat per card**, for a question that doesn't pollute the agent's context (Claude Desktop's `/btw`).

---

## 4. Agent-registered actions: prior art

The user's example: register "Switch app to #96 (port 8085)" once, then click it any time with no LLM in the loop.

| Prior art | Parameters | Safety and confirmation | Persistence |
|---|---|---|---|
| **VS Code `tasks.json` / `launch.json`** | `${input:id}` with `promptString`, `pickString`, `command` inputs; `dependsOn`; compound launches | Auto-run on folder open needs explicit "allow automatic tasks" and Workspace Trust **[from memory]** | `.vscode/*.json` in the repo, plus user tasks |
| **JetBrains run configurations** | templates, env, "before launch" steps, compound | manual run | `.idea/workspace.xml`, or shared `.run/*.run.xml` committed to git **[from memory]** |
| **Claude Code `.claude/launch.json`** ([docs](https://code.claude.com/docs/en/desktop)) | `runtimeExecutable`, `runtimeArgs`, `port`, `autoPort`, `cwd`, `env`, `url` | **Claude writes it**; the user edits it; secrets are kept out (use the local env editor) | committed file |
| **Claude Code skills with `disable-model-invocation: true`** | `$ARGUMENTS`, named `arguments` | user-only trigger; `allowed-tools` grant for that turn only | `.claude/skills` |
| **Raycast script commands** ([metadata](https://www.mintlify.com/raycast/script-commands/creating/metadata)) | up to 3 args: text, password, dropdown | `needsConfirmation` flag **[from memory]**; mode `silent`/`compact`/`fullOutput`/`inline` (inline refreshes on a timer) | script files in a folder |
| **Warp workflows** ([docs](https://docs.warp.dev/features/workflows)) | named args with description, default and **enum options** | runs in the terminal, so the user sees the command first | local, **repo `.warp/workflows`**, or Warp Drive (team) |
| **MCP prompts / tools / resources** | prompts = user-controlled (slash commands); tools = model-controlled | **tool annotations** (`readOnlyHint`, `destructiveHint`…) are *hints, untrusted by default* ([explainer](https://aident.ai/blog/mcp-tool-annotations-explained)) | server-defined |
| **MCP elicitation** ([overview](https://docs.mcp-use.com/typescript/client/elicitation)) | **form mode**: flat JSON-Schema fields; **URL mode** for secrets and OAuth | user can accept, decline or cancel; never use form mode for secrets | per request |
| **MCP Apps** (SEP-1865, an official extension since Jan 2026) ([SEP](https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp)) | `ui://` resources linked from tool metadata | **sandboxed iframe**; UI→host JSON-RPC is auditable; host decides consent | resource declared by the server |
| **OpenAI Apps SDK** | widget calls `window.openai.callTool()` | host mediates | `widgetState` per widget instance and message ([skybridge](https://docs.skybridge.tech/fundamentals/apps-sdk)) |
| **GPT Actions** | OpenAPI | `x-openai-isConsequential: true` = confirm every time; `false` = **"Always allow"** offered; GET defaults to not consequential ([forum](https://community.openai.com/t/how-to-stop-custom-gpt-displaying-confirm-deny-buttons/874551)) | per GPT |
| **Claude artifacts** | page code | private by default; capabilities declared up front | published page plus a small DB |
| **Claude Desktop task chips** | prefilled task | **Claude proposes, the user clicks** | per session |
| **Zapier AI Actions / n8n** | per field: "fixed value" vs "let AI guess" (Zapier); typed node params (n8n) | credentials stored apart from flows; n8n has a manual "execute" button and an MCP Server Trigger | server-side catalogs **[from memory]** |
| **Orca automations** **[local]** | CLI flags | scheduled; run history | Orca host |

**Design for Floatt actions** (stopping at the lowest rung of the ladder that works):
- **Registration**: an MCP tool `floatt.register_action({title, project, kind: shell|url|http|mcp_tool|prompt, command, cwd, params: JSON-Schema (elicitation subset), risk: read|write|destructive, scope: card|project|global})`.
- **Human approves at registration, not at every run.** The user sees the exact command text and cwd once, like Workspace Trust, then gets one-click runs. The approval is bound to a **hash of the command**: if an agent edits the action, it needs approval again, which blocks silent edits.
- **Risk drives confirmation**, GPT-Actions style. `read` runs on click. `write` runs on click with undo where possible. `destructive` always asks. The declared risk is untrusted (as with MCP annotations): Floatt can bump the risk class up from a denylist (`rm`, `git push`, `--force`) but never down.
- **Parameters**: enums and defaults (Warp), input prompts (VS Code); secrets come from the OS keychain, never stored in the action.
- **Persistence**: plain files, e.g. `.floatt/actions/<id>.json` per project (committable, like Warp repo workflows and `.run/` folders), plus a global store. Run history goes into the local DB.
- **Placement**: on the card (the "#96" task gets "Switch emulator to #96 Metro :8085"), in the project toolbar, and in the `Cmd+K` palette.
- **Lifecycle**: actions on a card **expire with it** (worktree removed means the action is archived). This avoids the build-up Raycast and VS Code users get.
- **Output**: toast or inline (Raycast modes); long runs stream into a Floatt terminal pane.

---

## 5. Huly: what to borrow, what to skip

Sources: [huly.io](https://huly.io/), [GitHub docs](https://docs.huly.io/integrations/github/), and a sparse clone of `hcengineering/platform/services/github` **[local code]**.

- **Features**:
  - projects with custom statuses and issue types; issues and **sub-issues**; milestones; **components**; labels; priority
  - **estimation, reported time and remaining time**; time reports
  - **Planner**: drag tasks onto your calendar (time-blocking)
  - **Team Planner**: a team calendar of everyone's tasks
  - **Inbox**: per-document notifications for things you follow
  - Docs (collaborative), chat, virtual office and video
  - **keyboard-first**: command palette and shortcuts
  - Licence: EPL-2.0 **[unverified]**
- **GitHub integration** (two-way):
  - Huly GitHub App; issues created in a linked project go to GitHub by default (there's a "Create issue without GitHub" escape); PRs appear in a PR tab; comments sync both ways.
  - **Conflicts (from the code)**: a per-field three-way diff (last synced snapshot vs Huly vs GitHub). When both sides changed a field, **"assume platform change is more important"**: Huly wins and the conflict is logged.
  - Rate limiting: a `TimeRateLimiter` per endpoint, default 25 ops/s.
  - It handles `projects_v2_item` webhook events. Whether it syncs Projects v2 custom fields fully is **[unverified]**.
- **Borrow**:
  - sub-issues; components and labels; estimate vs actual time (agents can log their wall-clock time automatically)
  - **Planner time-blocking** (a personal-productivity edge no agent tool has)
  - an inbox of followed items
  - `Cmd+K` and keyboard-first navigation
  - the **per-field three-way merge** with an explicit winner
- **Skip**: chat, virtual office and video, HR and recruiting, the heavyweight server stack (Huly self-hosting needs many services), and team-planner features before Floatt has teams.

---

## 6. Two-way sync with GitHub (Issues and Projects v2)

- **API facts**:
  - Projects v2 is **GraphQL only** (ProjectV2, items, `fieldValues`; mutations such as `addProjectV2ItemById` and `updateProjectV2ItemFieldValue`, one field per call **[from memory]**).
  - Limit: 5,000 points/hour for users, plus secondary limits on concurrency and content creation ([GitHub docs](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)).
  - `projects_v2_item` webhooks fire for **organization** projects, not user-owned ones **[unverified; from memory]**.
  - A desktop app can't receive webhooks anyway, so plan on **polling**: REST conditional requests (ETag, 304s don't count) for issues, and GraphQL `updatedAt`-ordered pages for project items.
  - The user's account is already rate-limited (workspace rule: no `gh api`), so budget calls.
- **How others do it**:
  - **Huly**: see section 5. Platform wins on conflict.
  - **Linear GitHub Issues sync**: per team↔repo; title, description, status, labels, assignee and comments both ways ([Linear](https://linear.app/integrations/synclinear)). Conflict policy undocumented; GitHub *Projects* fields aren't synced **[unverified]**.
  - **Plane**: two-way, but Plane-created items go out **only if labelled `github`** (an explicit opt-in gate); historical comments aren't imported ([Plane docs](https://docs.plane.so/integrations/github)).
  - **Zenhub**: two-way on issues, sub-issues, milestones, labels and PRs, but **does not sync GitHub Projects data** (import only, no plans to change) ([Zenhub](https://support.zenhub.com/article/git-hub-projects-integration)).
  - **Unito, Exalate**: field-mapping UIs and rule engines; conflicts are mostly last-write-wins **[unverified]**.
- **Recommendation**:
  - Map a Floatt project to a GitHub Project v2 plus its repos. Store `nodeId`, the `updatedAt` and a **base snapshot** for each synced field.
  - Do a per-field three-way merge. For a GitHub-backed field, **GitHub wins** (the opposite of Huly), and the local value is kept as a "conflict" note on the card.
  - Map statuses to single-select **option IDs**, not names; renames break name matching.
  - Opt-in per card (Plane's label gate): personal and agent tasks stay local unless marked "publish".
  - Writes go through a queue with backoff that reads the rate-limit headers.

---

## 7. Local-first apps with Google Drive backup

- **Obsidian** ([forum](https://forum.obsidian.md/t/sync-conflicts-with-google-drive-obsidian-sync/108275), [plugin](https://community.obsidian.md/plugins/google-drive-sync)):
  - Two sync systems on the same folder fight each other.
  - Remotely-Save can't sync in the background on Android and has "Failed to fetch" errors.
  - Drive-sync plugins warn that **manual uploads into their folder break things**.
  - The better plugins (NeoGDSync) **never silently overwrite**: they save conflict copies.
- **Joplin**: maintainers declined Google Drive (API and terms churn, cost) ([forum](https://discourse.joplinapp.org/t/gdrive-support/1140)). Users who point file-system sync at a Drive folder report "Google Drive sync hell" ([thread](https://discourse.joplinapp.org/t/google-drive-sync-hell/2154)).
- **Standard Notes**: offered encrypted automatic backups to Dropbox, Drive and OneDrive as files (backup, not sync) **[from memory]**.
- **Google API**:
  - `drive.file` and `drive.appdata` are **non-sensitive** scopes, so they need only basic verification. Full `drive` is **restricted** and needs a CASA assessment ([Google](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)).
  - `appDataFolder` is hidden from the user. Prefer `drive.file` with a visible "Floatt Backups" folder, so users can see and restore files without Floatt.
  - OAuth refresh tokens for apps left in "Testing" status expire after 7 days **[from memory]**, so publish the OAuth app.
  - Use loopback redirect plus PKCE in Tauri, and keep the token in the OS keychain.
- **Recommendation**:
  - **Backup, not sync.** Write periodic snapshot files: a zipped export of the Dexie tables as JSON, plus the markdown project and state files. Include the device ID, schema version and checksum.
  - Rotate with retention (e.g. 7 daily, 4 weekly). Add optional client-side encryption.
  - Ship a tested **restore** flow.
  - Never tell users to put the live IndexedDB or app data folder inside the Drive desktop client.
  - Real multi-device sync later means CRDT or op-log sync, with Drive at most as a blob store.

---

## 8. Synthesis

### 8.1 Patterns that work
- One worktree per task, with **setup scripts and "files to copy"** (Conductor, Claude Desktop `.worktreeinclude`).
- Drive Claude Code via **stream-json in and out, plus `--permission-prompt-tool=stdio`**, so permission prompts become UI events (Vibe Kanban). Or use a PTY for any-CLI support (Orca, Crystal, Squad), at the cost of structure.
- **Expose the app to agents as an MCP server** (Vibe Kanban, Orca CLI), so agents create tasks, workspaces and actions themselves.
- **Inline diff comments** sent back to the agent as one batch (Claude Desktop, Vibe, Cline).
- **Cards that track state on their own**, and auto-archive on PR merge.
- **Decision gates and blocking `ask`** as objects (Orca orchestration).
- A **mobile surface for approvals** (Dispatch, Nimbalyst iOS, Orca, Kanban Code push).

### 8.2 Gaps nobody fills well
1. A curated, **conflict-linted** library you enable per project.
2. A **personal** board across all projects that includes non-code work (writing, admin, calendar).
3. **Agent-registered one-click actions** with approval on registration.
4. **Human-readable local state**: markdown and JSON files you can commit, grep and back up.
5. **Shared-resource management** (ports, emulators, Metro, databases) across worktrees.
6. Good **GitHub Projects v2** two-way sync for an individual (most tools skip Projects v2).
7. **Time**: estimates, actuals, and agent time vs human review time.

### 8.3 Ideas where Floatt can be better
1. **Library with a conflict lint and a token meter.** Per-project toggles that write `enabledPlugins`; it flags overlapping triggers (e.g. `plan` vs `ccr-plan` vs `gsd:plan-phase`), hooks that inject into subagents, and version drift across scopes.
2. **Profiles**: one click applies a pack set plus board template plus actions to a project (e.g. "OSS contribution" = new-worktree, master-agent, commit, github-contributor, changeset).
3. **Board columns bound to skills, with gates.** Moving a card into Review runs `code-review`. The Ship column needs a human gate showing the exact PR text (the user's rule).
4. **Agent-registered actions** (section 4): approved once, bound to a hash, risk-classed, attached to the card, expiring with it. This solves the "#96 Metro" request directly.
5. **Resource broker**: Floatt hands out ports, emulators and simulators to worktrees, and offers "switch emulator to card X" as a built-in action. Fixes the most common parallel-agent pain.
6. **Attention inbox across projects** with keyboard triage, fed by Claude Code hooks (Notification, PermissionRequest, Stop) and git/PR state.
7. **Master/agent as a first-class local feature**: a coordinator session per workspace, worker sessions per card, Orca-style `ask` and gates. Local-first, so it doesn't require Claude Projects' cloud plus GitHub-App setup, and it works with the user's own worktree layout.
8. **Markdown state store**: each project's `tasks.md`, `PR.md` and `TODO.md` (the user's current workflow) stay the source of truth, with Dexie as an index. Agents read and write the files; Floatt renders them as a board. Nimbalyst's visual diffs show how to review markdown edits.
9. **Worktree hygiene**: setup scripts and files to copy; worktrees **outside** the repo by default (avoids the Metro/RN bug); a disk panel; auto-clean on merge.
10. **Planner time-blocking with agents** (from Huly): drag a card onto the calendar, and Floatt starts the agent so review lands in your review block.
11. **GitHub Projects v2 sync done safely**: opt-in per card, per-field three-way merge where GitHub wins, polling with ETag, a rate-limit budget shown in the UI.
12. **Drive backup as visible, versioned snapshots** (`drive.file` scope), with a restore test.
13. **Usage and cost per card/project**, read from `~/.claude/projects` transcripts, as opcode does.
14. **Phone approvals later**: start with Claude Remote Control rather than building a mobile app.
15. **Sustainability**: stay a personal command centre with a small core (the Vibe Kanban, Crystal and Roo lesson). Lean on Claude Code's native features (worktrees, Projects, Remote Control) instead of re-implementing them.

---

## 9. Unverified or caveated
- Conductor's agent-driving mechanism and licence; Zed's editor licence; Huly's licence and the depth of its Projects v2 field sync; Linear's conflict policy; Unito and Exalate conflict policy; Raycast `needsConfirmation`; VS Code automatic-task trust details; Zapier and n8n specifics; Google's 7-day refresh token for unpublished apps; org-only `projects_v2_item` webhooks; Standard Notes backup targets. All are from memory or secondary sources.
- Orca's 87.8k-star count came from a fetched README summary and looks high.
- Counts for claude-code-templates, wshobson and SuperClaude come from the projects' own marketing and aren't audited.
