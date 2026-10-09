# E. UX and UI design: Floatt as a command centre for Claude Code

researcherE. Scope: UX principles, information architecture, wireframes, flows, notifications, visual rules and MVP scope. Data model (C), orchestrator (D) and the Claude Code plumbing (B) are referenced, not designed here.

## 0. Where we start from

What Floatt `main` gives us today (read from `packages/app/src`):

- **Shell:** `screens/todo.screen.tsx` is a three-pane `ResizablePanelGroup`: sidebar (20%), main (55-80%) and a task detail pane (25%) that opens on selection. Under 900px the detail pane becomes a right-side `Sheet` with a drag-to-resize edge. A custom `DragRegion` and `WindowControls` replace the OS title bar on desktop.
- **Sidebar:** `SearchBar` at the top, `SmartListSection` (My Day, Important, Planned, Tasks, each with an icon colour and a count), then a drag-sortable group → list tree (`@dnd-kit`), then `ThemeToggle`.
- **Keys:** `use-keyboard-shortcuts.ts` has ⌘N (quick add), ⌘⇧N (new list), ⌘F (search), Space (toggle done) and Backspace (delete). Commands go through nonces in `command.store.ts`. There is **no command palette on `main`** yet; ⌘F search is the nearest thing, so the palette is new work.
- **Look:** Tailwind v4 with oklch tokens in `styles/globals.css` (violet primary at hue 275, softened dark surfaces, `.dark` class). Icons come from lucide, primitives are shadcn-style radix (`sheet`, `dialog`, `popover`, `context-menu`, `tooltip`, `switch`, `select`, `toaster`). There are per-list themes. `Platform` has `notifications`, `opener`, `window` and `menu`, so native notifications and "open in browser" already have a seam.

The design keeps that shell: sidebar, list, detail. It adds new kinds of content, not a new layout system.

### Prior art, and what we take from each

| Product | What it gets right | Taken into Floatt |
|---|---|---|
| Claude Code agent view (`claude agents`) | Groups rows into Needs input, Ready for review, Working and Completed. A one-line summary per row, refreshed from output at most every 15 s with no model call. A PR label coloured yellow, green, purple or grey. Space to peek and reply, filters `a:` `s:` `n:` `o:` | The state groups, the one-line rows, peek, the PR chip colours and the filter syntax in the palette |
| Claude Code desktop | A sidebar filtered by status and project. Sessions archive themselves when their PR merges. Draggable panes (chat, diff, preview, terminal, plan, tasks, subagent). A side chat that doesn't pollute the main thread | Auto-archive on merge, the pane set for the task focus view, and "ask aside" |
| Conductor | Workspace = worktree with its own chat, terminal, diff, checks, PR and archive flow | The task focus view as a self-contained workspace, with archive as an explicit step |
| Vibe Kanban | A board with an In Review column, a diff with comment-on-line, a dev-server preview. Card glyphs: running dots, a hand for a pending approval, play for a dev server, a triangle for failure, a dot for unseen activity | The card glyph language and the In Review column |
| Crystal | `completed_unviewed` as its own state | "Done, not yet seen" bolds a row until you look at it |
| Linear | An inbox with J/K, H to snooze (cancelled by new activity), G-then-key navigation | The inbox mechanics and G-chords |
| Raycast | ⌘K action panel, Enter for the primary action, quicklinks with arguments, aliases and hotkeys | The action palette, and actions as parameterised quicklinks |
| Huly | A tracker with statuses, sub-issues, a board and list views over one dataset | The board and list as two views of the same tasks |

## 1. UX principles

Each principle comes with the rule that enforces it.

1. **Calm by default.** The home screen shows changes and requests, not activity. A working agent is one line, and nothing streams unless you open it. *Rule:* no view auto-scrolls a transcript you didn't open, and a row's text changes at most every 15 s.
2. **Attention-driven.** Every list sorts "needs you" first, and one number (the inbox count) sits in the sidebar, the window title and the dock or tray badge. *Rule:* if the count is 0 you can walk away, and nothing outside the inbox may claim otherwise.
3. **Glanceable status.** One line per agent: state glyph, name, task, live step, step timer, heartbeat age, budget. The step comes from the agent's own tool events (no LLM). A short summary is written only when a turn ends. *Rule:* "what is it doing?" and "is it testing forever?" are answered by the row: `running pnpm jest · 4m12s (usual 1m30s)`.
4. **One place for decisions.** Every question, approval and choice an agent raises becomes an **inbox card** with options, a recommended default and a one-line reason. Agents never ask in chat alone; a question in chat is mirrored as a card. *Rule:* a numbered list of 15 decisions becomes one grouped card with "Accept 12 recommended".
5. **Keyboard-first, mouse-complete.** ⌘K for everything, G-chords to navigate, J/K to move, Y for "accept recommended", E to edit, ⌘Enter to send. Everything is also clickable, and every shortcut shows in tooltips and the palette.
6. **Progressive disclosure.** Row → peek (Space) → focus view (Enter) → raw transcript or terminal (one tab further). Each level answers more, and none is required for routine work.
7. **Never block on the LLM for routine work.** Switching a device, committing approved text, pushing, cleaning a worktree and syncing a workspace are deterministic **actions** that run immediately. The LLM drafts text and decides; it is never in the loop for clicking a button.
8. **Every status carries its verb.** A merged PR shows "Clean up". A stalled agent shows "Peek" and "Nudge". A device on the wrong server shows "Switch". You never read a state and then go looking for how to act on it.
9. **Exact text is the approval.** What you see in the approval sheet is byte-for-byte what is sent: commit message, PR title and body, push target. Edits are kept and shown against the agent's draft.
10. **Local truth, links for the rest.** Worktrees, ports, devices and git state come from the machine, live. GitHub state shows its age ("as of 2m") and always has a link, so you never need to remember a CI URL.

## 2. Information architecture

### Sidebar (evolves `sidebar.component.tsx`)

```
┌──────────────────────────────┐
│ [F] Floatt          ⌘K  ◐    │  logo, palette hint, theme toggle
│ ┌──────────────────────────┐ │
│ │ ⌕ Search or ⌘K           │ │  SearchBar becomes the palette trigger
│ └──────────────────────────┘ │
│ ◆ Inbox                  3   │  ← attention count (amber if > 0)
│ ▣ Command centre        9●   │  ← running agents
│ ⇄ Resources          4 ports │
│ ◫ Library                    │
│ ─────────────────────────────│
│ PROJECTS                   + │  ← the group → list tree, reused
│ ▾ Open source                │  group  = workspace
│     expo            ●2 ◆1    │  list   = project (repo-backed)
│     rn-firebase     ●1       │  badges = running and needs-you
│     rn-svg                   │
│ ▾ Bappi                      │
│     floatt          ●3       │
│     my-app                   │
│ ─────────────────────────────│
│ PERSONAL                     │  ← today's smart lists, unchanged
│   My Day 4 · Important 2 ... │     (collapsible)
│ ─────────────────────────────│
│ ⟳ GitHub 2m · ☁ Drive 1h  ⚙  │  ← sync footer, opens status
└──────────────────────────────┘
```

- **Top-level views** (new "smart views", rendered like `SmartListSection` with icon colour and count): Inbox, Command centre, Resources, Library. They sit above projects because they span projects.
- **Projects** reuse the group → list tree and its drag-and-drop: a group is a workspace (for example "Open source"), a list is a project bound to a repo. Selecting a project opens its board in the main pane.
- **Personal** keeps My Day, Important and Planned for the user's own tasks. Agent tasks can also appear in My Day.
- **Main pane** shows the selected view. The **detail pane** (the existing third panel, or the Sheet when narrow) is the peek, with Enter promoting it to the full **task focus view**, which takes main and detail together.
- **Status bar (new, 24px, bottom):** `● 6 working  ◆ 3 need you  ⇄ :8081 :8085 :8086  ▢ Pixel 8 → #96  ⟳ GitHub 2m`. Every segment is clickable, so the core questions (what's running, which ports, which device) are answered on every screen.

### Navigation

| Key | Goes to |
|---|---|
| ⌘K | Action palette (search, run, navigate) |
| G I / G H / G R / G L | Inbox / Command centre (home) / Resources / Library |
| G P | Project switcher; ⌘1-⌘9 jump to pinned projects |
| J / K, Space, Enter, Esc | Move, peek, open focus view, back out one level |
| ⌘⇧A | Approvals only (inbox filtered to `kind:approval`) |
| ⌘; | Ask aside (side question to an agent, not added to its thread) |

Existing ⌘N, ⌘⇧N, ⌘F and Space keep their meaning inside task lists.

## 3. Key screens

Glyphs used in the wireframes: `●` working, `◆` needs you, `◎` in review, `✓` done, `✕` failed, `‖` paused or stopped, `○` idle, `↻` heartbeat age, `$` budget. Section 6 maps them to real icons and colours.

### 3.1 Command centre (home, across projects)

```
┌ Command centre ───────────────────────────────────── filter: s:all  ⌘K ┐
│ ◆ 3 need you    ● 6 working    ◎ 2 in review    ✓ 4 done today   $18/40 │
├────────────────────────────────────────────────────────────────────────┤
│ NEEDS YOU                                                               │
│ ◆ agent4  expo#51086 digest      approve commit + PR text      2m  [Y] │
│ ◆ agent7  floatt#96 tanstack tab  pick: keep or drop devtools   6m  [Y] │
│ ◆ agent2  rnkc#1042 inset         permission: run adb shell     1m  [→] │
│ WORKING                                                                 │
│ ● agent3  floatt#95 query cache   running bun vitest   1m10s  ↻4s  $1.2 │
│ ● agent5  expo#51210 router       editing app/_layout.tsx      ↻2s  $0.8 │
│ ● agent1  rn-svg#2533 mask        running jest · 7m02s (usual 1m30s) ⚠  │
│ ● agent6  rnfb#8471 auth          subagent: reviewer (2/3)     ↻9s  $2.1 │
│ ● agent8  floatt#97 drive backup  waiting on metro build       ↻1s  $0.4 │
│ ● agent9  expo#51300 image        reading packages/expo-image  ↻3s  $0.2 │
│ IN REVIEW                                                               │
│ ◎ agent10 floatt#94 sidebar       PR #111  CI ✓  review pending      2h │
│ ◎ agent11 floatt#95 palette       PR #112  CI ✕ 1 failing   [Peek CI] 1h │
│ DONE TODAY (2 unseen)                                                   │
│ ✓ agent12 floatt#93  merged PR #110 · worktree cleaned          [Seen]  │
│ … 3 more                                                                │
├───────────────────────────────── right rail ───────────────────────────┤
│ Ports  :8081 base · :8085 #96 · :8086 #95 · :8090 free                  │
│ Device Pixel 8 → :8085 (#96)   [Switch…]   iPhone 16 sim → :8081       │
│ PRs    open 4 · merged this week 6 · checks failing 1                   │
└────────────────────────────────────────────────────────────────────────┘
```

- Grouping follows Claude Code's agent view. Ctrl+S groups by project instead.
- `[Y]` accepts the recommended option without leaving the screen. `[→]` means the item needs the focus view, as a permission dialog does.
- A step that runs past twice its usual length gets `⚠`, answering "is it testing forever?" without a question.

### 3.2 Attention inbox

```
┌ Inbox  3 ──────────────── [All] [Approvals] [Decisions] [Alerts]  ⌘K ┐
│ ☐ ◆ APPROVAL  agent4 · expo#51086                              2m    │
│     Commit "Accept ArrayBuffer in digest" + PR to expo/expo           │
│     ★ Send as drafted   (passes style check, 1 file, +42 −3)          │
│     [Open sheet  ⏎]  [Send  ⌘⏎]  [Edit  E]  [Snooze  H]               │
│ ☐ ◆ DECISIONS ×15  agent7 · floatt#96                          6m    │
│     12 have a recommendation · 3 need you                             │
│     [Accept 12 recommended  Y]  [Review all  ⏎]                       │
│     ▸ 13. Keep devtools panel when the query cache is empty?          │
│         ○ Keep, show "No queries"   ★ Hide the tab (matches others)   │
│         Why: other devtools tabs hide when they have no data.         │
│     ▸ 14. Port for the playground app?  ★ 8087 (next free)  ○ 8085   │
│     ▸ 15. Write your own answer…                                       │
│ ☐ ◆ PERMISSION  agent2 · rnkc#1042                             1m    │
│     Run `adb shell input keyevent 82`   ★ Allow once  ○ Allow for    │
│     this task  ○ Deny                                                 │
│ ─ Low priority ──────────────────────────────────────────────────── │
│ ☐ ○ CLEANUP   floatt#93 merged → remove worktree, delete branch      │
│     [Clean up  C]                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ X select · Y accept recommended · 1-9 pick · E edit · H snooze ·     │
│ ⌘⏎ send · Shift+Y accept all selected (approvals excluded)           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Card anatomy:** kind, agent and task, the question in one line, options with ★ on the recommended one (pre-selected), a one-line *why*, and its keys.
- **Batch approve:** select with X, then Shift+Y accepts the recommended option on every selected decision and permission. Approvals that post to GitHub are **excluded from batches** until their exact text has been opened once. This keeps the "approve the exact text" rule while allowing a fast path: after you open the sheet, Y works.
- **Snooze** (H) is Linear's: new activity on the same subject cancels it.
- Cards **resolve themselves** when the underlying state changes, for example when the agent answers itself or the PR merges. They move to a "Resolved" filter rather than lingering (section 5).

### 3.3 Project board, with agent cards

```
┌ floatt · Board  [Board] [List] [Timeline]   group: status  ⟳ synced 2m ┐
│ Backlog 6      Todo 3         In progress 3    In review 2    Done 12   │
│ ┌──────────┐  ┌──────────┐  ┌──────────────┐ ┌──────────────┐          │
│ │#101 docs │  │#98 kbd   │  │#96 TanStack  │ │#94 sidebar   │  ✓ #93   │
│ │          │  │ ▶ Start  │  │ Query tab    │ │ ◎ PR #111    │  ✓ #92   │
│ └──────────┘  └──────────┘  │ ◆ agent7     │ │ CI ✓ review… │  …       │
│ ┌──────────┐  ┌──────────┐  │ needs 3 dec. │ │ agent10 idle │          │
│ │#102 i18n │  │#99 ...   │  │ ▮▮▮▮▮▯▯ 5/7  │ └──────────────┘          │
│ └──────────┘  └──────────┘  │ :8085  $3/5  │ ┌──────────────┐          │
│                              └──────────────┘ │#95 palette   │          │
│                              ┌──────────────┐ │ ◎ PR #112    │          │
│                              │#97 Drive bkp │ │ CI ✕ lint    │          │
│                              │ ● agent8     │ │ [Fix CI ▶]   │          │
│                              │ metro build  │ └──────────────┘          │
│                              │ 2m14s ↻1s    │                           │
│                              │ ▮▮▯▯▯ 2/5    │                           │
│                              │ :8086  $0.4/5│                           │
│                              └──────────────┘                           │
└────────────────────────────────────────────────────────────────────────┘
```

Agent card, in detail:

```
┌────────────────────────────────────┐
│ #96 TanStack Query tab      ⋯      │ title, menu (⌘K scoped to the card)
│ ● agent3 · running bun vitest      │ state glyph, owner, live step
│   1m10s (usual 1m30s)   ↻ 4s       │ step timer vs history, heartbeat
│ ▮▮▮▮▮▯▯ steps 5/7                  │ agent's TodoWrite steps = Floatt steps
│ $1.20 / $5.00  ▮▮▯▯▯▯▯▯             │ budget (cost or tokens, per project)
│ ⑂ floatt-96-tanstack · :8085       │ branch, worktree port
│ PR —   CI —                        │ PR and CI chips appear once they exist
└────────────────────────────────────┘
```

- The columns are the task status (Huly-like, synced with GitHub Projects). The agent state is an overlay on the card, not a column, so a task can be "In progress" with an agent that is ◆ waiting on you.
- Dragging Todo → In progress offers "Start agent" (the same as ▶ Start). Dragging into Done while an agent is running asks to stop it first.
- List view is the same data as rows (one line each), using the 28px row from today's sidebar.
- The heartbeat is the age of the last tool event: grey under 60 s, amber at 2 min with no events while working, red at 10 min with "Stalled? [Peek] [Nudge] [Stop]".

### 3.4 Task focus view

```
┌ ← floatt#96 TanStack Query tab   ● working   ⑂ floatt-96-tanstack  :8085 ┐
│ Issue ↗  PR —  CI —   [▶ Switch device to #96] [⟳ Restart metro] [⋯]     │
├─ Timeline ───────────┬─ Chat ──────────────────────┬─ [Diff][Checks][Evidence][Term] ┤
│ STEPS                │ agent3  10:42               │ Diff  4 files  +212 −18          │
│ ✓ 1 Read issue       │ Added the Query tab behind  │ ▸ src/tabs/query-tab.tsx  +160   │
│ ✓ 2 Reproduce        │ the devtools flag. Running  │ ▸ src/tabs/index.ts        +4    │
│ ✓ 3 Implement tab    │ vitest now.                 │ ▸ src/hooks/use-query.ts  +40 −12│
│ ● 4 Test   1m10s     │                             │ ▸ src/tabs/index.test.ts   +8 −6 │
│ ○ 5 Screenshot       │ ┌ Tool: Bash ─────────────┐ │                                  │
│ ○ 6 Draft PR         │ │ bun vitest run   1m10s  │ │ Checks (local)                   │
│ ○ 7 Hand to you      │ │ ▸ 41 passed · 0 failed… │ │ ✓ tsc   ✓ vitest 41/41  ● lint   │
│ TOOLS (live)         │ └─────────────────────────┘ │ Checks (CI, as of 2m)            │
│ 10:41 Edit ×3        │                             │ — not pushed yet                 │
│ 10:41 Bash tsc  12s  │ you  10:44                  │                                  │
│ 10:42 Bash vitest ●  │ also cover the empty state  │ Evidence                         │
│ SUBAGENTS            │ (queued; sent after turn)   │ [img] query-tab-light.png        │
│ ├ explorer  ✓ 40s    │                             │ [img] query-tab-dark.png         │
│ └ reviewer  ○ queued │ ┌─────────────────────────┐ │ [img] empty-state.png            │
│                      │ │ Message agent3…   ⌘⏎    │ │                                  │
│ $1.20/5 · ctx 38%    │ └─────────────────────────┘ │                                  │
└──────────────────────┴─────────────────────────────┴──────────────────────────────────┘
```

- **Timeline** (left) answers "what is it doing" structurally: the steps (from the agent's todo list), tool calls with their duration, and the subagent tree. Click a tool to expand its output inline.
- **Chat** (centre) is the conversation. A message sent while the agent works is queued, as Claude Code does, and labelled "queued". ⌘; opens "ask aside" for a question that doesn't steer.
- **Right tabs:** a **Diff** (read-only in the MVP; line comments that go back to the agent later), **Checks** (local results first, then CI with an "as of" stamp and links to each job), **Evidence** (screenshots and recordings the agent attached, shown as thumbnails with a light and dark pair), and **Term** (the worktree's dev server and log).
- The header holds the task's **quick actions**: actions registered for this task or project, run with no LLM.

### 3.5 Approval sheet

A right-side `Sheet` (existing `sheet.ui.tsx`), opened from an inbox card or the task header.

```
┌ Approve: expo#51086 ─────────────────────────────────── Esc ┐
│ Sends to   origin = abappi19/expo  (fork) ✓ not upstream    │
│ Branch     expo-crypto-51086-digest-arraybuffer → expo:main │
│ Changes    1 file  +42 −3   [View diff]   local checks ✓ 3/3│
├─ 1 Commit ──────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Accept ArrayBuffer in digest                             ││
│ │                                                          ││
│ │ digestStringAsync only took strings. Pass ArrayBuffer... ││
│ └──────────────────────────────────────────────────────────┘│
│ Style: ✓ plain, no AI footer     Edited: no                 │
├─ 2 Push ────────────────────────────────────────────────────┤
│ git push -u origin expo-crypto-51086-digest-arraybuffer     │
├─ 3 Pull request ────────────────────────────────────────────┤
│ Title ┌ [expo-crypto] Accept ArrayBuffer in digest ───────┐ │
│ Body  ┌───────────────────────────────────────────────────┐ │
│       │ Fixes #51086                                      │ │
│       │ - digest now takes ArrayBuffer ...                │ │
│       └───────────────────────────────────────────────────┘ │
│ Changeset  .changeset/quick-cats-sing.md  ✓ present         │
├─────────────────────────────────────────────────────────────┤
│ [Commit only]  [Commit + push]   [Send all ⌘⏎]   [Ask agent │
│                                                   to revise]│
└─────────────────────────────────────────────────────────────┘
```

- **Editable in place.** Edits are saved as you type, and "Edited: yes, show diff" compares them with the agent's draft.
- **Safety header:** the remote, the fork-or-upstream check, the base branch and the checks are shown before any text, and a wrong remote turns the header red and disables send.
- **Send all** runs commit → push → PR create as one action with a three-step progress list in the sheet, then closes and leaves the PR chip on the card. Nothing goes to the LLM.
- "Ask agent to revise" opens a one-line box and sends it to the agent. The card stays in the inbox until a new draft arrives.

### 3.6 Resources panel

```
┌ Resources ──────────────────────────────── [Worktrees][Servers][Devices][Repos] ┐
│ WORKTREES (7)                        branch                 dirty  PR     owner  │
│ floatt/floatt-96-tanstack-tab        floatt-96-tanstack…    3 f    —      agent3 │
│ floatt/floatt-93-sidebar             floatt-93-sidebar      clean  ✓#110  —      │
│                                            [Clean up]  merged 2h ago            │
│ expo/expo-crypto-51086-digest        expo-crypto-51086…     clean  #—     agent4 │
│ …                                                                                │
│ DEV SERVERS                          port   worktree                 state       │
│ metro                                8081   repos/floatt (base)      ● up  [Stop]│
│ metro                                8085   floatt-96-tanstack-tab   ● up  [Logs]│
│ metro                                8086   floatt-95-palette        ‖ down[Start]│
│ vite                                 1420   floatt-97-drive          ● up  [Open]│
│ DEVICES                              connected to                                │
│ Pixel 8 (adb, USB)                   :8085 → #96   [Switch to ▾] [Reload] [Shot] │
│ iPhone 16 Pro (sim)                  :8081 → base  [Switch to ▾] [Reload] [Shot] │
│ REPOS (base clones)                  vs origin   vs upstream                     │
│ repos/expo                           ✓ even      ⚠ 14 behind  [Sync workspace]   │
│ repos/floatt                         ✓ even      ✓ even                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- "Switch to ▾" lists running dev servers by **task name and port**, for example `#96 TanStack tab · :8085`. Picking one runs the registered switch action (adb reverse or opening the URL, then a reload) and updates the "connected to" column. One click replaces a chat round trip.
- "Clean up" appears only when it is safe (merged, or clean with no PR). Otherwise it reads "Clean up… (3 uncommitted files)" and asks for confirmation with the file list.
- "Sync workspace" runs the one-way sync (`gh repo sync`, then a fast-forward-only merge) and refuses with a reason if a base clone has drifted.
- Ports that clash, or a server whose worktree no longer exists, show in amber with a fix button.

### 3.7 Library browser

```
┌ Library ───────────────────────────────── ⌕ search skills, agents…   [+ New] ┐
│ Skills 48    │ NAME               KIND    SOURCE        USED   PROJECTS       │
│ Agents 12    │ new-worktree       skill   workspace     41×    ●●○○ 2/4       │
│ Tools/MCP 9  │ commit             skill   workspace     88×    all            │
│ Instructions │ github-contributor skill   workspace     63×    all            │
│ Actions 23   │ reviewer           agent   pack:core     19×    ●●●○ 3/4       │
│ Packs 4      │ expo-module        skill   pack:expo     7×     ●○○○ 1/4       │
│ Kits 3       │ switch-device      action  floatt        12×    floatt, expo   │
│ ─────────    ├──────────────────────────────────────────────────────────────┤
│ Filter       │ new-worktree · skill · v3 · edited 2d ago                    │
│ ☐ unused 30d │ Sets up a git worktree for an OSS issue; syncs fork first.   │
│ ☐ conflicts  │ Enabled in   floatt [on]  expo [on]  rnfb [off]  rn-svg [off]│
│              │ Triggers     "new worktree", "start on issue <n>"            │
│              │ Files        SKILL.md, new-worktree.sh   [Open] [Diff vs v2] │
│              │ Last runs    agent4 ✓ 2h · agent7 ✓ 1d · agent1 ✕ 3d [log]   │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

- One table for every kind, faceted on the left. Per-project enablement is a row of switches (`switch.ui.tsx`), so you see where a skill is on without opening each project.
- Usage counts and the last runs come from the run history, which shows what is used, what fails and what is dead.
- **Packs** are installable bundles (plugin-like), and **kits** are starter sets applied to a new project. Both open to the list of items they contain, with an on/off switch per item.
- Conflicts (two skills with overlapping triggers, two instructions that disagree) are a filter, not a modal.

### 3.8 Action palette and quick actions

```
┌──────────────────────────────────────────────────────────────┐
│ ⌕ switch                                                     │
├──────────────────────────────────────────────────────────────┤
│ ACTIONS                                                      │
│ ▶ Switch Pixel 8 to #96 (port 8085)        floatt   ⌥1   ⏎   │
│ ▶ Switch Pixel 8 to #95 (port 8086)        floatt            │
│ ▶ Switch iPhone sim to base (8081)         floatt            │
│ GO TO                                                        │
│ → floatt#96 TanStack Query tab · agent3                      │
│ COMMANDS                                                     │
│ ⌘ Start agent on issue…                                      │
├──────────────────────────────────────────────────────────────┤
│ ⏎ run · ⌘K more (edit, pin, hotkey, copy command, history)   │
└──────────────────────────────────────────────────────────────┘
```

- ⌘K is global and context-aware: with a task selected, its actions rank first. Prefixes follow agent view: `a:agent7`, `s:blocked`, `p:floatt`, `#96`, or a pasted GitHub URL, which offers "Start agent on this issue".
- **An action** is a label, a parameterised command, a scope (global, project or task), an optional confirmation, and a history. Claude registers actions while it works ("Switch app to #96 (port 8085)"), and they appear without an LLM round trip. ⌘K on an action shows its exact command before you pin it or give it a hotkey.
- **Quick actions bar:** up to 5 pinned actions in the task header and the status bar (⌥1-⌥5). Running one shows a spinner in the button, then a toast with the result and "View log". Failures stay as an inline red line under the button, not a modal.
- Actions whose task is gone (worktree removed, port free) grey out with the reason. Cleanup removes actions scoped to that task.

### 3.9 GitHub sync status

```
┌ GitHub sync ─────────────────────────────────────────────────────────────┐
│ floatt        abappi19/floatt · Project "Floatt roadmap"   ✓ synced 2m   │
│   ↑ 2 outbound (status changes)  ↓ 0 inbound   [Sync now]               │
│ expo          expo/expo issues (read) · fork abappi19/expo  ✓ 5m         │
│ rnkc          kirillzyusko/… · Project —                     ⚠ conflict 1│
│   #1042 status: Floatt "In review" vs GitHub "Todo"                     │
│   ★ Keep Floatt   ○ Take GitHub        [Resolve]                         │
│ API budget    4,210 / 5,000 left · resets 18:40 · webhooks on ✓          │
│ OPEN PRs   #111 floatt ◎ CI ✓ ↗   #112 floatt ✕ CI lint ↗   #51120 expo ↗│
└──────────────────────────────────────────────────────────────────────────┘
```

- Every line has an "as of" time and a ↗ link to the page on GitHub (PR, checks, project). This is the answer to "had to remember URLs to check CI".
- When the rate limit is low, the UI says so and stretches polling. It never hides stale data; the age simply grows.
- Two-way sync conflicts become inbox cards with a recommended side.

### 3.10 Backup settings (Google Drive)

```
┌ Settings › Backup ────────────────────────────────────────────┐
│ Google Drive       abappi19@… ✓ connected        [Disconnect]  │
│ Folder             /Floatt backups               [Change]      │
│ Schedule           ● Hourly while changed  ○ Daily  ○ Manual   │
│ Include            ☑ Tasks and projects  ☑ Library (skills,    │
│                    agents, actions)  ☑ Drafts  ☐ Run transcripts│
│                    Worktrees and node_modules are never copied. │
│ Encryption         ☑ Encrypt with passphrase   [Change]        │
│ Last backup        12:05 ✓ 3.2 MB · next when data changes     │
│ [Back up now]                                                   │
│ RESTORE            Oct 8 12:05 · Oct 8 11:02 · Oct 7 … [Restore…]│
└────────────────────────────────────────────────────────────────┘
```

Restoring shows what will change (counts per kind) before it runs. A failed backup shows in the sidebar footer (`☁ Drive ✕`), never as an interrupt, unless it has failed for more than 24 hours.

## 4. Key flows: today versus Floatt

"Msgs" counts chat turns the user has to type or read today.

### 4.1 Start a task from a GitHub issue

| Today (chat with master) | Floatt |
|---|---|
| Paste the issue URL to master. Master checks for open PRs, posts the result, proposes a branch name and asks which agent. The user says go. The agent runs new-worktree and reports the path and port. About 5 msgs. | ⌘K, paste the URL (or pick it from the issue-hunter feed). A **preflight card** shows: open PRs none ✓, accepted label, branch `floatt-96-tanstack-tab`, project floatt, next free port 8087, agent template "fixer", budget $5. Press ⏎. The card appears in Working. **2 keys + 1 confirm.** |

Preflight blocks only on a real conflict ("PR #110 already fixes part of this"). Otherwise it is prefilled and Enter accepts it.

### 4.2 Watch and steer an agent

| Today | Floatt |
|---|---|
| "What is agent3 doing?" Master asks agent3 and relays a paragraph. "Is it testing forever?" goes another round. Steering means typing to master, who relays it. 2-4 msgs per check. | Glance at the row: `running pnpm jest · 7m02s (usual 1m30s) ⚠`. Space to peek: the last output and the step list. Type "skip the e2e suite, unit only" in the peek and press ⏎, and it is queued to agent3 directly. **0 msgs to check, 1 to steer.** |

### 4.3 Test on a device by switching to a worktree

| Today | Floatt |
|---|---|
| "Switch the emulator to #96." The agent finds the port, runs adb reverse and reloads, then reports. Repeat for each comparison. 2 msgs per switch. | Status bar `▢ Pixel 8 → #95`, click, pick `#96 · :8085`. Or ⌥1 if the action is pinned, or the task header's "Switch device to #96". **1 click, no LLM.** The device line updates when the reload is done. |

### 4.4 Approve and raise a PR

| Today | Floatt |
|---|---|
| The agent posts a long message with the commit text, PR title and body. The user reads it in chat, asks for edits, gets a new long message, says "commit and raise PR", then gets the PR URL in another message. 3-6 msgs. | The inbox shows ◆ APPROVAL. ⏎ opens the sheet with the remote check, the commit, push and PR text, and the changeset. Fix a word in place, then ⌘⏎ **Send all**. A progress list ticks commit ✓ push ✓ PR #113 ✓, and the card shows the PR chip with CI status. **1 open, optional edits, 1 send.** |

### 4.5 After a merge: clean up and sync

| Today | Floatt |
|---|---|
| Notice the merge (or get told), then ask "clean the worktree", then "update the workspace", then ask for tasks.md to be updated. 3 msgs, with stale notices in between. | The PR turns purple (merged). The task moves to Done and the agent row archives itself. One low-priority inbox card: "#93 merged → Clean up (remove worktree, delete branch, free :8086, drop task actions) + Sync workspace". Press C. **1 key.** The resources panel shows the repo "even" again. |

### 4.6 Turn a repeated request into an action or skill

| Today | Floatt |
|---|---|
| The user asks for the same thing again and again ("switch to 8085", "restart metro with clear cache"), and each time is an LLM round trip. | Floatt notices the third similar command an agent ran for you and offers **"Make this an action?"** with the exact command, parameters (`port`, `device`) inferred, and scope. Enter saves it and it shows in ⌘K immediately. For multi-step routines, "Save as skill" opens a draft SKILL.md in the library with the transcript excerpt attached, and you review it like any other approval. |

The detection only offers, and the offer is a low-priority card that is shown once per pattern. An agent can also register an action itself, through the tool B and D define.

## 5. Notification design

### What interrupts and what waits

| Tier | Delivery | Triggers |
|---|---|---|
| **Interrupt** | OS notification (`platform.notifications.send`), dock or tray badge, amber inbox count | An agent is blocked and **cannot continue**: a permission, a question with no default, an approval it is waiting on. CI failed on a PR you opened. Budget hit. Stalled for 10 min. Device or server crashed during an active test |
| **Badge** | Inbox count and card, no OS notification | Decisions with a recommended default that the agent can keep working around. PR review comments. Sync conflicts. Cleanup suggestions are low priority and don't count toward the amber badge |
| **Feed** | Row update only, visible when you look | Progress, step changes, turn summaries, done-without-action, merges after cleanup has run, backups |

Rules:

- **Blocking beats important.** Only something that stops work interrupts. Agents mark each question `blocking: true|false`; non-blocking ones need a default, and the agent proceeds on the default after a timeout you set per project (off by default).
- **Batch interrupts.** At most one OS notification per 2 minutes, which gathers what arrived in that window: "3 agents need you". Clicking it opens the inbox, not a single agent.
- **Focus and quiet hours.** "Do not disturb until…" holds interrupts as badges. CI failures still badge.
- **Away recap.** When the app gains focus after more than 15 min away, a one-line banner appears: "While you were away: 2 PRs merged, 1 needs you, 3 finished. [Show]". No per-event toasts are replayed.

### Dedupe and stale suppression

- **Dedupe key** = `(kind, subject, state)`, for example `(approval, floatt#96, commit+pr)`. A new notice with the same key **replaces** the card in place (keeping its position, refreshing its time). It never adds a second card.
- **Collapse by agent:** several decisions from one agent within a minute merge into one grouped card ("×15").
- **Supersede by state:** each card names the state it is about. When that state changes (the agent resumed, the PR merged, the port was freed, a newer draft arrived), the card resolves itself and moves to "Resolved" with the reason ("superseded by a newer draft"). It cannot linger as a stale ask.
- **Master-relay suppression:** a notice that repeats a fact already on screen (the same PR state, the same agent step) is dropped. This replaces the "duplicate and stale agent notices" in chat today.
- **Expiry:** feed items fade after 24 h. Resolved cards are kept for 7 days for audit, then pruned.

## 6. Visual and interaction details

### Status language (colour + shape + word, never colour alone)

| State | Glyph | Lucide icon | Token (new, both themes) | Hue |
|---|---|---|---|---|
| Working | ● | `Loader2` (spins) / `CircleDot` with reduced motion | `--status-working` | primary violet 275 |
| Needs you | ◆ | `Hand` | `--status-attention` | amber (same family as My Day's `amber-500`) |
| In review | ◎ | `GitPullRequest` | `--status-review` | sky (Planned's `sky-500`) |
| Done | ✓ | `CircleCheck` | `--status-done` | green |
| Failed | ✕ | `TriangleAlert` | `--destructive` (existing) | red |
| Stopped / idle | ‖ / ○ | `CirclePause` / `Circle` | `--muted-foreground` | neutral |
| Done, unseen | ✓ + bold row | `CircleCheck` + dot | — | — |

PR chips use agent view's colours: amber = pending checks or review (or failed checks, with ✕), green = ready, purple = merged, grey = draft or closed. Add the status tokens to `globals.css` next to the existing ones, with `.dark` variants at the same lightness steps already used (for example L 0.68 for dark-theme accents).

Per-list themes stay on task lists and appear as a 3px accent stripe on project cards and rows. They never sit behind status colours, so a pink theme can't hide an amber "needs you".

### Density and type

- Two densities: **compact** (28px rows, the sidebar's `h-7`, the default for the command centre and lists) and **comfortable** (36px, the default for the inbox, where text matters).
- `tabular-nums` (already used for counts) on every timer, port and budget, so the numbers don't jitter.
- Monospace (`ui-monospace`) only for commands, paths, branch names and diff text.
- Text is truncated with a fade (as Vibe Kanban does) and the full text is in a tooltip, never wrapped onto two lines in rows.

### Empty states

Each one has one sentence and one primary action:

- Inbox 0: "Nothing needs you." plus the last resolved time. No illustration, because it is the state we want most.
- Command centre with no agents: "No agents running. [Start on an issue ⌘K]".
- Resources with no devices: "No devices. Connect a phone over USB or [Boot a simulator]".
- Library with nothing for a project: "Nothing enabled for floatt. [Apply a kit]".
- Board column empty: the column header only. No placeholder art, to keep boards calm.

### Error states

- **Inline, at the thing that failed,** with what failed, why (the first stderr line), and [Retry] [View log] [Copy]. No modal errors for action failures.
- **Agent crashed:** the row turns red ✕ with "exited (code 1) during Bash: pnpm jest", plus [Resume] [View transcript].
- **Offline or rate-limited GitHub:** an amber footer chip ("GitHub: rate limited, data as of 14m, retry 18:40"). Stale chips show their age instead of disappearing.
- **Safety refusals** (a push to upstream, a sync with a drifted base clone, cleanup with uncommitted files) are errors that explain the rule and offer the safe alternative. They never offer a "force" button.

### Motion

- Only two things move: the working spinner and a 600ms heartbeat pulse when a tool event arrives. Both are off under `prefers-reduced-motion`, falling back to a static icon plus the `↻ 4s` text.
- Rows never re-sort under the cursor or keyboard focus. Reordering waits until focus leaves the group, then animates for 150ms or less.
- Sheets and dialogs keep the radix and `tw-animate-css` defaults already in the app.

### Dark and light

Use the existing theme tokens and `ThemeToggle`. Check every status token against both `--card` surfaces for 3:1 contrast as an icon and 4.5:1 as text. Screenshots in Evidence show the light and dark pair side by side when both exist.

### Accessibility

- Every glyph has a text equivalent. A row reads as "agent3, working, running bun vitest, 1 minute 10 seconds, last activity 4 seconds ago".
- The inbox count uses `aria-live="polite"`. Only interrupt-tier items use `assertive`, and those are batched like the OS notifications.
- Full keyboard paths for every flow in section 4. Focus returns to the originating row when a sheet closes. Shortcuts are single letters only when no input is focused (the same `isTypingTarget` guard as today).
- Hit targets are at least 24px, even in compact density, because icon buttons pad out to the row height.

## 7. MVP UI scope versus later

### MVP (makes the 9-agent day calm)

1. **Sidebar evolution:** Inbox, Command centre and Resources views, projects in the existing tree, a sync footer, and the status bar.
2. **Command centre:** one line per agent across projects, grouped by state, with peek-and-reply in the detail pane (Space).
3. **Inbox:** approval, decision (single and grouped), permission and cleanup cards. Y, 1-9, E, H, X and Shift+Y. Dedupe, supersede and resolve.
4. **Approval sheet:** editable commit, push and PR text, the remote safety header, Send all with progress.
5. **Task focus view:** steps, live tools and subagents timeline, chat with queued messages, read-only diff, local checks plus CI chips with links, and an evidence thumbnail list.
6. **Resources panel:** worktrees, dev servers and ports, devices with Switch, base clones with Sync workspace, and Clean up.
7. **Action palette (⌘K):** navigation, agent-registered actions, pinning plus ⌥1-⌥5, and "Start agent on issue" with preflight.
8. **Project board:** status columns, agent cards with step, heartbeat, budget, port and PR chips, and drag between columns (dnd-kit is already in the app). List view comes for free from the same rows.
9. **Library browser,** read and toggle: the table, facets, and per-project switches. Editing opens the file in the editor.
10. **GitHub sync status:** per-project sync age, open PRs with links, and the conflict card.
11. **Notifications:** the three tiers, batching, and the away recap.

### Later

- Inline diff comments sent back to the agent, and a side-by-side diff.
- An embedded preview browser (Vibe Kanban and Claude desktop style) and the device screen mirrored in a pane.
- A terminal pane with input, beyond the read-only logs.
- "Make this an action?" detection and "Save as skill" authoring (MVP: agents register actions explicitly, and the library has "+ New").
- Timeline view (Gantt-like) per project, and cost dashboards across weeks.
- Rearrangeable panes (Claude desktop style) and multi-window support.
- Drive backup restore UI with diff previews (MVP: connect, schedule, back up now, last backup, plain restore).
- A mobile or menu-bar companion that shows only the inbox and Y/N.
- Snooze schedules, digest emails, and team or multi-user views.

## Sources

- [Claude Code agent view docs](https://code.claude.com/docs/en/agent-view) (also saved locally as `agent-view.md` in this folder)
- [Redesigning Claude Code on desktop for parallel agents](https://claude.com/resources/articles/claude-code-desktop-redesign), [Claude Code desktop docs](https://code.claude.com/docs/en/desktop)
- [Conductor: run parallel Claude Codes](https://www.conductor.build/workflows/run-parallel-claude-codes), [Conductor docs](https://www.conductor.build/docs/index)
- Vibe Kanban: `clones/vibe-kanban/packages/ui/src/components/WorkspaceSummary.tsx` (card glyphs), [overview](https://openapps.pro/apps/vibe-kanban)
- Crystal: `clones/crystal/shared` (session states including `completed_unviewed`)
- [Linear inbox](https://linear.app/docs/inbox), [Linear snooze](https://linear.app/docs/snooze)
- [Raycast action panel](https://manual.raycast.com/action-panel), [Raycast quicklinks](https://manual.raycast.com/quicklinks.md), [aliases and hotkeys](https://manual.raycast.com/command-aliases-and-hotkeys.md)
- Floatt `main` (888e81c): `packages/app/src/screens/todo.screen.tsx`, `components/sidebar/*`, `hooks/use-keyboard-shortcuts.ts`, `stores/command.store.ts`, `styles/globals.css`, `platform/platform.type.ts`
