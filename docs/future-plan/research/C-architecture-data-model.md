# C: Floatt as a Claude Code command centre (architecture fit and data model)

researcherC. Read from `repos/floatt` at `888e81c`. All repo paths below are relative to that clone.

## Key decisions (read this first)

1. **Files are the source of truth and Dexie is a rebuildable index.** Everything that an agent may read or edit, that should sync between devices, or that the user wants in git lives as markdown with YAML frontmatter in one **vault** folder that the user picks. Dexie keeps today's table shapes so queries, hooks and components barely change, but it becomes a cache. If its schema changes, Floatt deletes it and re-indexes from the files, so the cache never needs a migration.
2. **Device-local state never goes in the vault.** That covers repo checkout paths, worktrees, live process IDs, raw run logs, timers, window layout and OAuth tokens. They live in the Tauri app-data directory, Dexie or the OS keychain. The vault holds only portable content.
3. **The library is ordinary vault content.** Skills, agents, commands, tools (MCP), hooks and instructions are files under `library/`. Each one keeps Claude Code's native format, plus a `floatt:` frontmatter block that Floatt strips on output. A project's **kit** is a list in `project.md`. When Floatt starts a run, it builds the kit into a content-addressed **local plugin directory** outside the repo and passes it with `claude --plugin-dir` (or SDK `plugins: [{type:"local"}]`). The worktree is not touched.
4. **A project is a list with an optional repo.** Today's Group → Subgroup → Task → Subtask tree carries over: a Group is a sidebar group, a Subgroup (list) is a project, a Task is an issue, and a Subtask is a checklist step. Smart lists stay virtual queries, and the Command Centre, Inbox and Board are virtual queries too.
5. **Agent features are desktop-only behind the Platform seam.** `Platform.vault` is required (desktop: Rust; web: an IndexedDB key-value "file system"). `Platform.process` is optional, and when it's missing, agents, GitHub sync, library import and Drive backup are hidden. Desktop-only modules are passed in by the shell, so they never enter the web bundle.
6. **External sync talks through the CLIs the user already signed into.** GitHub goes through `gh api graphql`, so Floatt stores no token. Google Drive is the one OAuth flow, and its refresh token goes in the keychain.

---

## 1. Lead: the library (skills, agents, tools, instructions)

### 1.1 Why it needs a home (evidence from this machine)

The `kitten-bot` skill (the example at the time of writing; it has since been removed from Floatt, and the examples below work the same for any skill) is copied into at least five repos (Floatt and several of the user's other projects, including the pack's own repo). A `diff -rq` shows `SKILL.md` and `agents/session-boot.md` **already differ** between the copies and the pack repo the pack's own repo. That repo holds about 50 `bmad-*` skills as one pack. `~/.claude/` has user skills, agents and commands, plus plugins that `~/.claude/plugins/installed_plugins.json` records per scope (user or project, with `projectPath`). So the library has to deliver three things:

- one canonical copy
- enablement per project
- detection of drift between the canonical copy and what a repo actually has

### 1.2 Where library items live in the vault

```
<vault>/library/
├── skills/<id>/SKILL.md            # native Claude Code skill folder, other files alongside
├── agents/<id>.md                  # native subagent file (name, description, tools, model)
├── commands/<id>.md                # native slash command
├── tools/<id>.json                 # one MCP server: {"floatt":{...},"server":{"command":...}}
├── hooks/<id>.json                 # a settings.json "hooks" fragment
├── instructions/<id>.md            # CLAUDE.md-style rule fragments ("never push without approval")
├── packs/<id>.md                   # provenance and update unit: source + member list
└── kits/<id>.md                    # optional named selections a project can extend
```

- Each item has **one current version** in the vault. Older versions come from the vault's git history. Storing several versions side by side is skipped until a real pin conflict appears.
- Item IDs are kind-scoped slugs (`skill:kitten-bot`, `tool:pencil`). That's the same name Claude Code shows, which keeps them readable for agents.

### 1.3 Metadata schema

Native keys stay untouched. Floatt adds one namespaced block and strips it when it outputs the item.

```yaml
---
name: kitten-bot                      # native
description: Bappi's brain. Mobile/RN architect persona...   # native
floatt:
  id: kitten-bot
  kind: skill                         # skill | agent | command | tool | hook | instruction
  version: 1.4.0                      # semver; Floatt bumps patch on in-app edit
  source:                             # where it came from, for "update available"
    type: git                         # local | claude-user | claude-plugin | git
    url: git@github.com:you/claude-skills.git
    path: .claude/skills/kitten-bot
    ref: main
    commit: 3f2c1ab
  pack: my-claude-skills
  tags: [persona, react-native, architecture]
  scope: [project, run]               # user | project | run: where it may be applied
  requires: [instruction:code-style, agent:session-boot]   # kind:id[@semver-range]
  conflicts: [skill:other-persona]
  contentHash: sha256:…               # of the item minus the floatt block; drift detection
---
```

For a JSON item (tool or hook), the same object sits under a top-level `"floatt"` key, next to `"server"` or `"hooks"`. The TS type, validated with Zod like `schemas/task.schema.ts`:

```ts
// packages/library/src/types/library-item.type.ts
export type LibraryKind = "skill" | "agent" | "command" | "tool" | "hook" | "instruction";
export type ItemRef = `${LibraryKind}:${string}`;           // optional @range suffix
export interface LibraryMeta {
  id: string; kind: LibraryKind; version: string;
  source: { type: "local" | "claude-user" | "claude-plugin" | "git"; url?: string; path?: string; ref?: string; commit?: string };
  pack?: string; tags: string[]; scope: Array<"user" | "project" | "run">;
  requires: ItemRef[]; conflicts: ItemRef[]; contentHash: string;
}
```

### 1.4 Per-project enablement (the kit)

A project's kit is stored inline in `project.md`, so it travels with the project:

```yaml
kit:
  extends: rn-app                     # library/kits/rn-app.md (optional)
  packs: [bmad]                       # enable every member of a pack...
  include: [skill:kitten-bot, agent:ccr-code-review, tool:pencil, instruction:no-push-without-approval]
  exclude: [skill:bmad-party-mode]    # ...minus these
  apply: plugin                       # plugin (default) | claude-dir
```

- **The resolver** is a pure function, `resolveKit(kit, items) → { items, missing, conflicts, cycles }`. It adds `requires` transitively and reports `conflicts`, which is the kit builder's warning list. It's a good target for a vitest test.
- **Global defaults** live in a `kits/default.md` that every project extends unless it opts out.

### 1.5 Dexie search index for discovery

```ts
libraryItems: "[kind+id], kind, pack, *tags, sourceType, contentHash, path"
kitUsage:     "[projectId+itemRef], itemRef, projectId"     // derived: "used by 4 projects"
copies:       "[repoPath+itemRef], itemRef, contentHash"    // found in linked repos' .claude/, drift view
```

- Search reuses the existing Fuse pattern, the index `components/search/search-results.component.tsx` builds (open PR #9 deletes the unused `services/search.service.ts`), over name, description, tags and the first 2 KB of the body.
- A library with hundreds of items is the strongest case for the semantic tier in `docs/future-plan/local-ai-plan.md`, embedding `description` for lookups like "find me a skill that writes changesets". When that tier comes, add an `embeddings` row per item, keyed by `contentHash`.

### 1.6 Import

Import is read-only on the source and always **copies into the vault**, recording `source`. Imports run in Rust (`library_scan_source`) against a fixed set of roots, not through the vault jail:

| Source | What to read |
|---|---|
| `~/.claude/skills/*/SKILL.md`, `~/.claude/agents/*.md`, `~/.claude/commands/*.md` | `source.type: claude-user` |
| Plugins | `~/.claude/plugins/installed_plugins.json`, then each `installPath`'s `skills/`, `agents/`, `commands/`, `hooks/`, `.mcp.json`. One pack per plugin. `source.type: claude-plugin` |
| Linked repos | `<repo>/.claude/{skills,agents,commands}`, `.mcp.json`, `CLAUDE.md`. Deduped by `contentHash`, so the five kitten-bot copies show as "1 item, 3 variants, choose canonical" |
| Git pack repos | Shallow clone into app-data `cache/packs/<hash>/`, then pick items to copy. Reads `marketplace.json` or `.claude-plugin/plugin.json` when present. "Update" means re-fetch, diff `contentHash` and show the diff before overwriting |

### 1.7 Applying a kit to a run

- **`plugin` (default).** Floatt writes the resolved kit as a Claude Code plugin under app-data `kits/<kitHash>/`: `skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `.mcp.json`, with the `floatt:` blocks stripped. Because the folder is content-addressed and immutable, it's built once and reused. Floatt then runs `claude --plugin-dir <dir>` and passes instructions with `--append-system-prompt-file <dir>/instructions.md`. Both flags are confirmed in `claude --help` on this machine. The SDK takes `plugins: [{ type: "local", path }]` with `systemPrompt: { type: "preset", preset: "claude_code", append }`.
  - Nothing lands in the worktree, so agents can't commit kit files.
  - The repo's own committed `.claude/` still loads, and the repo wins on a name clash. The kit builder shows the clash.
- **`claude-dir` (fallback).** This mode is for sessions Floatt doesn't launch, such as the user opening the worktree in VS Code's Claude extension. Floatt writes into `<worktree>/.claude/...`, records `.claude/.floatt-kit.json` (paths and hashes, for cleanup and drift), and adds the paths to `.git/info/exclude`. That exclude file is per-repo, shared by its worktrees and never committed.

### 1.8 Packages and screens for the library

- **`packages/library` (`@floatt/library`).** It holds:
  - `schemas/` (item and kit)
  - `services/library.service.ts` (create, edit, version bump), `import.service.ts`, `materialise.service.ts` (kit to a `{path: content}` map that Rust writes)
  - `utils/resolve-kit.util.ts` (pure, tested)
  - `queries/`, `hooks/use-library.ts`
- **Screens.**
  - `library.screen.tsx`: browser with kind, tag, pack and source facets, search, "used by" counts and drift badges.
  - `library-item.screen.tsx`: item editor with a native-schema form (e.g. SKILL.md needs `name` and `description`), a markdown body and file attachments for skill folders.
  - `kit-builder.component.tsx`: a project tab with a pack and item tree, toggles, automatic requires, conflict warnings, and a preview of the generated plugin tree.
- **Platform split.** Browsing and editing are pure vault operations, so they work on the web too. Import and apply need `Platform.process` and the extra Rust read roots, so they're desktop-only.

---

## 2. The codebase today

### 2.1 Map

| Area | Where | Notes |
|---|---|---|
| Packages | `packages/app` (everything), `packages/config` (tsconfig bases), `apps/web` (Next 15 `output: "export"`), `apps/desktop` (Vite 8 + Tauri 2) | `CLAUDE.md` says features become **sibling packages**, not subfolders. |
| Entry points | `apps/desktop/src/main.tsx`, `apps/web/app/page.tsx` → `FloattApp.tsx` (`ssr:false`) | Each wraps `<App/>` in `<PlatformProvider platform={…}>`. |
| Platform | `packages/app/src/platform/platform.type.ts`: `notifications`, `opener`, `window`, `menu` | `CLAUDE.md` still lists only notifications and opener, so it's out of date. |
| Dexie | `services/db.service.ts`, `consts/db.const.ts`: `DB_NAME="floatt"`, `DB_VERSION=1`, tables `groups`, `subgroups`, `tasks` (`[subgroupId+sortOrder]`, `[isCompleted+subgroupId]`), `subtasks` | There has been no schema migration yet. Booleans are stored as `Bit`; `sortOrder` is sparse (`SORT_ORDER_STEP=1000`); IDs come from `nanoid(12)` (`utils/id.util.ts`). |
| Other persistence | `localStorage`: theme (`ui.store.ts`), per-list themes (`theme.store.ts`, Zustand `persist` key `floatt:list-themes`), sheet width, My Day dismissals, panel layout (`autoSaveId`) | List themes are **not** in Dexie, so today's data is already split across two stores. |
| Services | `task`, `subtask`, `group`, `subgroup`, `reorder` (rebalances the **whole list** on every move), `repeat`, `reminder`, `my-day` (search is a Fuse index inside `search-results.component.tsx`) | — |
| Stores | `ui.store` (selection, theme, search, sort), `command.store` (nonce-based command requests), `toast.store`, `theme.store` | — |
| Routing | **None.** `App.tsx` → `AppShell` → `TodoScreen`; `ui.store.selectedList: ListSelection` picks the main view | — |
| Shell | `screens/todo.screen.tsx`: resizable sidebar / main / detail panels, a right `Sheet` under 900 px, `DragRegion` and `WindowControls` | — |
| Tauri | `tauri.conf.json`: `csp: null`. `capabilities/default.json`: core, opener, notification, window and menu permissions. `Cargo.toml`: opener and notification plugins only. `lib.rs`: a leftover `greet` command | There are no fs, shell, dialog or sidecar entries. |
| Tests | `utils/repeat.util.test.ts` only (vitest, `src/**/*.test.{ts,tsx}`) | There's no CI (`.github/` is missing), no linter and no Dexie test setup. |
| Layer violations | `components/search/search-results.component.tsx` and `hooks/use-keyboard-shortcuts.ts` import `db` directly | Fix these before the write path moves to the vault. (Fixed in PR #8, FL-01.3.) |

### 2.2 What carries over

- **Task model and UI**: rows, the detail panel, steps, due dates, reminders, repeat, My Day and Important.
- **Virtual smart lists**: the pattern for Command Centre, Inbox, Board and Conflicts.
- **@dnd-kit sortable** (sidebar, task list, steps): board columns.
- **Toasts**: `toast.store`.
- **Confirm dialog**: `confirm-destructive-dialog.ui.tsx`.
- **Native menus**: `Platform.menu`.
- **Per-list themes**: per-project themes.
- **Notification scheduling**: "agent finished" and "needs input" alerts.
- **The `command.store` nonce pattern and `use-keyboard-shortcuts.ts`**: the base for a keyboard-first palette, built from the installed radix `Dialog` and `fuse.js` with no new dependency.

### 2.3 What blocks the new direction

1. **Data is in IndexedDB**, so agents, git, iCloud and Syncthing can't see it.
2. **There's no process, fs, dialog or watch capability**, and the web build can never have them.
3. **`csp: null`.** Once Floatt renders markdown written by agents, an XSS in the webview could reach the process capability, which is remote code execution.
4. **There's no navigation beyond list selection.**
5. **`packages/app` is both the shell and the Tasks module.** A sibling package that imports `@floatt/app` UI can't also be imported by `App.tsx` without a cycle.
6. **`reorderTasks` rewrites every row**, which with files would mean N file writes and N git diffs per drag.

---

## 3. Data model: vault files with a Dexie index

### 3.1 How it compares with other tools

| System | Model | What to take from it |
|---|---|---|
| Obsidian | Files are truth; `.obsidian/` holds config; a metadata cache in IndexedDB is rebuilt from the files | **The model to copy.** Users also bring their own sync (git, iCloud, Syncthing). |
| Logseq | A file graph with block IDs written into the files, later moved to a SQLite "DB version" | Don't write volatile or derived data into files, and don't put IDs on every line. Keep entities coarse, one per file. |
| Taskwarrior | UUIDs, `modified` timestamps, user-defined attributes, a sync server (TaskChampion in 3.x) | Use stable IDs and unknown-field passthrough. Don't trust clocks for merges. |
| todo.txt | One line per task, `+project @context due:` | Very easy to grep and git-friendly, but no notes or nesting. Shows how cheap the format can be. |
| Backlog.md | One markdown file per task with YAML frontmatter, a kanban view, built for AI agents | **The closest prior art** for agent-editable tasks. |
| The user's workspace | `CLAUDE.md` rules; `_notes/tasks.md` with one row per task and status **derived** from git and GitHub by `update-tasks.sh`; `draft/<repo>-<issue>-<slug>/{PR.md,TODO.md}`; `worktrees/<repo>/<branch>` | The structure maps one to one onto the files below. **Don't** rewrite derived columns into a synced file: the hook's rewrite works on one device but causes churn and conflicts across several. |

### 3.2 Where things live

| What | Where | Synced? |
|---|---|---|
| Vault (content) | A folder the user picks, default `~/Floatt/` (visible, so it can be opened in VS Code, git-initialised or put in iCloud) | Yes, by the user's own tool |
| Device config | Tauri `appConfigDir/config.json`: `vaultRoot`, `worktreeRoot`, `{ projectId → localRepoPath }`, `maxConcurrentRuns`, GitHub sync owner flag | No |
| Device state | `appDataDir/`: `runs/<runId>/turn-<n>.jsonl` (raw stream-json), `kits/<hash>/`, `cache/packs/` | No |
| Index and UI state | Webview IndexedDB `floatt-index` (rebuildable) and `floatt` v1 (legacy, read-only after migration), plus localStorage | No |
| Secrets | OS keychain (`keyring` crate): Google refresh token, backup passphrase (optional) | No |
| Worktrees | `<worktreeRoot>/<project-slug>/<branch>/`, default `~/Floatt-work/worktrees/…`, the user's own convention | No |

A hidden `~/.floatt/` was considered and rejected: the user wants to read the notes, iCloud only syncs certain locations, and a picked folder covers git, Syncthing and Drive equally.

### 3.3 Vault layout

```
~/Floatt/
├── CLAUDE.md                         # global durable rules, given to every run
├── .gitignore                        # written on init: .floatt/trash/, *.floatt-tmp-*
├── .floatt/
│   ├── vault.json                    # {"schemaVersion":1,"vaultId":"…","groups":["Work","OSS","Personal"]}
│   ├── migrations/                   # dexie-v1-2026-10-08.json (one-time export, kept)
│   └── trash/                        # soft deletes
├── library/…                         # section 1
├── projects/
│   ├── tasks/                        # default personal list (today's "Tasks")
│   │   ├── project.md
│   │   └── tasks/buy-milk.md
│   └── floatt/
│       ├── project.md                # metadata + kit + github map; body = project context for agents
│       ├── TODO.md                   # optional free checklist (the draft/TODO.md convention)
│       ├── tasks/
│       │   ├── vault-reconciler.md
│       │   └── vault-reconciler/     # optional attachments: PR.md, screenshots
│       ├── milestones/v0-2.md
│       ├── notes/sync-research.md
│       ├── decisions/2026-10-08-files-are-truth.md
│       ├── runs/2026-10-08-1012-vault-reconciler-k3x9.md
│       └── time/<deviceId>/2026-10.md  # append-only per device, conflict-free
```

**Layout rules:**
- **One entity per file.** Two devices editing different tasks never conflict.
- **Projects are flat.** The group is a frontmatter string, so regrouping doesn't move a folder and agents' `--add-dir` paths stay stable.
- **The parent project comes from the folder.** Moving a task to another project is a file move.
- **Filename = ASCII slug of the title, falling back to the ID.** A Bengali title produces an empty slug, hence the fallback. Renaming a title doesn't rename the file, which avoids churn.

### 3.4 Frontmatter schemas

**project.md**
```yaml
---
id: Hc7pQ2mXk9aB
name: Floatt
group: Work
sortOrder: 3000
kind: code                       # code | personal
status: active                   # active | paused | archived
key: FLT                         # display prefix (FLT-k3x9 / FLT#12)
repo: git@github.com:abappi19/floatt.git   # portable; local path is device config
defaultBranch: main
statuses: [backlog, todo, doing, review, done]   # board columns
components: [ui, vault, agents, library]
estimateUnit: points             # points | hours
theme: ocean                     # moves out of localStorage
agents: { maxConcurrent: 2, permissionMode: acceptEdits, model: opus }
kit: { … }                       # section 1.4
github: { … }                    # section 5
created: 2026-10-08T10:12:00Z
---
Project context for agents (what it is, how to build, gotchas).
```

**tasks/<slug>.md**: everything in today's `Task` plus the Huly fields.
```yaml
---
id: k3x9Qm2LpA7c
title: Vault reconciler
status: doing                    # one of project.statuses; done ⇔ completed
sortOrder: 4500
parent: Zp81…                    # sub-issue of another task (same project)
milestone: v0-2                  # milestones/<id>.md
labels: [vault, perf]
component: vault
estimate: 3
important: true
due: 2026-10-12
reminder: 2026-10-11T09:00:00+06:00
repeat: { kind: weekly, interval: 1 }
myDay: 2026-10-08
assignee: agent                  # human | agent | @github-login
dependsOn: [Ab12…]               # merge-order / queue gating
branch: vault-12-reconciler
pr: https://github.com/abappi19/floatt/pull/13
github: { … }                    # section 5
created: 2026-10-08T10:12:00Z
updated: 2026-10-08T11:40:00Z
completed: null
---
Notes (markdown).

## Steps
- [x] Parse frontmatter
- [ ] Watcher debounce
```
Today's `Subtask` rows become the `## Steps` checkboxes, with index IDs `${taskId}:${n}`. A step's notes become an indented bullet. Per-step IDs are lost, which is acceptable because nothing references them.

**milestones/<id>.md** `{ id, title, due, state: open|closed, github: { milestoneNumber, milestoneId } }` with a description body.
**decisions/<date>-<slug>.md** `{ id, date, status: accepted|superseded, supersedes?, tags }` with a Context / Decision / Consequences body. These are one file each because an append-only `decisions.md` conflicts when two devices add to the end.
**time/<deviceId>/<yyyy-mm>.md** has one line per entry, `2026-10-08T10:00+06:00 45m k3x9Qm2LpA7c fixed debounce`. Per-device files mean appends never conflict. The running timer stays in Dexie only.
**runs/<…>.md**: see section 6.

**Serialisation rules (needed for git):**
- Parse and write with the `yaml` package (eemeli), whose `parseDocument` keeps comments and key order when Floatt edits one field. This is the only new parsing dependency.
- Use a fixed key order per schema, LF line endings, a trailing newline, and omit default or empty values (`important: false`).
- Zod schemas use `.passthrough()`, so **unknown keys written by agents or newer versions are kept**.
- Only semantic changes bump `updated`; derived values are never written.

### 3.5 The Dexie index

A new database, `floatt-index`, with `INDEX_VERSION`. A version mismatch means `Dexie.delete` and a rebuild. The task, project and step tables keep the field names and indexes of today's `tasks`, `subgroups` and `subtasks` tables (`subgroupId` = projectId, `isCompleted: Bit`), so `queries/` and `hooks/` move over almost unchanged and only the **write path** in `services/` changes.

```ts
files:      "path, kind, entityId, hash, mtimeMs"
groups:     "id, sortOrder"                               // from vault.json
subgroups:  "id, groupId, sortOrder, [groupId+sortOrder], status, kind"   // projects
tasks:      "id, path, subgroupId, status, dueDate, isImportant, addedToMyDayAt, reminderAt, parentId, milestoneId, *labels, assigneeKind, [subgroupId+sortOrder], [isCompleted+subgroupId], [subgroupId+status]"
subtasks:   "id, taskId, [taskId+sortOrder]"
milestones: "id, subgroupId, due, state"
notes:      "id, path, subgroupId, *tags"
decisions:  "id, subgroupId, date"
runs:       "id, subgroupId, taskId, status, device, queuedAt, [subgroupId+status], [status+queuedAt]"
timeEntries:"id, taskId, day"
libraryItems, kitUsage, copies                            // section 1.5
inbox:      "key, kind, subgroupId, createdAt"            // derived attention items
inboxState: "key"                                         // device-local read/dismissed
problems:   "path, kind"                                  // parse errors, conflict copies, duplicate ids
derived:    "subgroupId+taskId"                            // git/GitHub-derived state (ahead, PR state, CI)
```

### 3.6 Write path, watching and reconciliation

**Write (Floatt):**
1. `read(path)` returns `{content, hash}`.
2. Parse, apply a **field patch** (e.g. `{status:"review"}`) and serialise.
3. `write(path, next, expectHash)`.
4. Rust compares hashes. On a mismatch it returns `conflict`, and the service re-reads and re-applies the same patch once. A field patch therefore merges cleanly with an agent's concurrent body edit.
5. Update the index row, and `useLiveQuery` re-renders.

**Atomic write (Rust):** write `.<name>.floatt-tmp-<rand>` in the same directory, `fsync`, then `rename` over the target (`tempfile::NamedTempFile::persist`). The rename is atomic on POSIX and replaces the file on Windows. The watcher ignores temp files.

**Watch:** Rust `notify-debouncer-full` (about 200 ms), recursive on the vault, ignoring `.git/` and the temp pattern. It sends batched `{path, kind}` over a Tauri `Channel`.

**Reconcile (pure TS, testable):**
```ts
// packages/vault/src/utils/reconcile.util.ts
export function planReconcile(scan: VaultEntry[], indexed: FileRow[]): { read: string[]; drop: string[] };
```
- On startup, Rust `scan()` returns `(path, mtimeMs, size)` for every file in one IPC call. Only files whose mtime or size changed are read.
- A watcher event triggers read, hash and compare. **Floatt's own writes need no suppression list**: the index already holds the hash it wrote, so its own event matches and is skipped.
- **Missing `id`** (a file made by a person or an agent): assign one and write it back once.
- **Duplicate `id`** (a copied file): the second file gets a new ID.
- **Invalid frontmatter**: the file goes in `problems` and the index keeps the last good row. Floatt never "fixes" the file.

**Body conflicts** (the notes editor saves over an external edit): keep both. The user's text goes to `<slug>.conflict-<yyyymmdd-hhmm>.md`, a toast appears, and the copy shows in the **Conflicts** inbox entry.
**Sync-tool duplicates** (`*.sync-conflict-*` from Syncthing, `name 2.md` from iCloud, `<<<<<<<` from git) are indexed as `problems`, never as entities, and surface in the Inbox.

### 3.7 Ordering without churn

Keep `sortOrder` and `SORT_ORDER_STEP`, but change `reorder.service.ts` to set the **midpoint between the two neighbours**, so a move touches one file. It rebalances the whole list only when the gap drops below 1e-6, which is rare. This avoids adding a fractional-indexing dependency.

### 3.8 Multi-device and git

- Content is synced by git, iCloud or Syncthing. Each device rebuilds its Dexie index.
- Nothing device-specific or derived goes in the files, so sync noise is limited to real edits.
- Merges use content hashes, never `updated` times, because clocks drift.
- Optional later: a vault auto-commit (debounced `git add -A && git commit -m "floatt: …"`), in the style of obsidian-git.

### 3.9 Migration from Dexie v1

1. On first desktop launch after the update, the user picks the vault folder through Rust's native dialog.
2. Dump `floatt` v1 and the `floatt:list-themes` localStorage key to `.floatt/migrations/dexie-v1-<date>.json`.
3. Map the old data to files:

   | Old | New |
   |---|---|
   | Group | `vault.json.groups` |
   | Subgroup | `projects/<slug>/project.md` (`kind: personal`, with its list theme) |
   | Task | `tasks/<slug>.md` |
   | Subtasks | the `## Steps` checklist |
   | `isCompleted` | `status: done` |

4. Build `floatt-index` from the files.
5. Leave `floatt` v1 untouched for one release, then delete it.
6. Test the whole migration with vitest against an in-memory `VaultFs`.

---

## 4. Huly-like task management in the model

| Huly feature | Floatt model |
|---|---|
| Issues and sub-issues | A task file with `parent:` (indexed as `parentId`). Steps stay for lightweight checklists, and a step can be promoted to a sub-issue file. |
| Identifier (`HULY-123`) | `key` plus the GitHub number when linked (`FLT#12`), otherwise `FLT-` and the first 4 characters of the ID. Sequential local numbers would collide when two offline devices create tasks, so they're skipped. |
| Milestones | `milestones/<id>.md`, with `milestone:` on the task. Progress is a query. |
| Labels and components | `labels: []` (a multiEntry index); `components` is a project list and `component:` is set on the task. |
| Estimates | `estimate` with the project's `estimateUnit`. Board column sums are a query. |
| Time tracking | Per-device monthly log files (section 3.4). A timer lives in Dexie and becomes a log line when stopped. An agent run's duration counts automatically (derived, not logged). |
| Inbox | A virtual list over `inbox` rows (section 6.4). Read and dismissed state is device-local. |
| Keyboard-first | A command palette (`Mod+K`) built on the radix Dialog and Fuse, with actions registered in a `commands.const.ts`. It extends `use-keyboard-shortcuts.ts` and `command.store`. Single-key verbs on the selected task (`s` status, `l` label, `e` estimate, `a` assign to agent, `r` run). |

The quick-capture list is renamed to the existing **Tasks** smart list. **Inbox** is used only for things that need attention, as in Huly.

---

## 5. Two-way sync with GitHub issues and Projects (v2)

### 5.1 Mapping

| Floatt | GitHub |
|---|---|
| project.md `repo` | Repository (issues, labels, milestones) |
| project.md `github.projectId` | ProjectV2 (`PVT_…`), owner/number |
| task | Issue (`I_…`) **plus** a ProjectV2 item (`PVTI_…`). A task without a repo maps to a DraftIssue item. |
| `title`, body (notes + Steps) | issue title, body (GitHub renders `- [ ]` task lists) |
| `status` | the ProjectV2 single-select "Status" option (`PVTSSF_…` field, option IDs mapped per status); `done` ⇔ issue `CLOSED` |
| `labels`, `component` | repo labels; component maps to a `component:<name>` label |
| `milestone` | repo milestone |
| `parent` | GitHub sub-issues (`addSubIssue`, `parent`) |
| `estimate`, iteration, `due` | ProjectV2 number, iteration and date fields (IDs in the map) |
| `assignee: @login` | assignees |
| time logs, runs, notes, decisions, myDay, reminders, sortOrder, kit | **local-only** |

**Field and option IDs** are global and the same on every device, so they're kept in `project.md`:
```yaml
github:
  repo: abappi19/floatt
  projectId: PVT_kwHOAbc…
  fields:
    status:   { id: PVTSSF_lAHO…, options: { backlog: f75ad846, todo: 47fc9ee4, doing: 98236657, review: 2b1c…, done: 0f3e… } }
    estimate: { id: PVTF_lAHO… }
    iteration:{ id: PVTIF_lAHO… }
  syncOwner: true      # see 5.3 (device config overrides; here only a default)
```

**Per task:**
```yaml
github:
  number: 12
  issueId: I_kwDOK…
  itemId: PVTI_lAHO…
  syncedAt: 2026-10-08T11:40:02Z
  remoteUpdatedAt: 2026-10-08T11:39:58Z
  base: { title: 3f9a1c, body: 77de02, status: 1b2c3d, labels: a0a0a0, milestone: 000000, estimate: 9e9e9e, parent: 000000 }
```
`base` holds a short hash of each synced field as it was at the last sync. It's what makes a **three-way merge** possible on any device, which is why it lives in the file and not in device state. It's written only when a field actually changes in either direction, never on a no-op poll.

### 5.2 Conflict rules (one rule, field by field)

For each synced field, compare `local` and `remote` against `base`:
- **Only one side changed:** take that side.
- **Both changed to the same value:** nothing to do.
- **Both changed differently:**
  - **`title` or body:** keep local in the file and add an inbox **conflict item** showing the remote text, with *keep mine*, *take theirs* and *edit merged*. Text is too valuable for last-writer-wins.
  - **`status`, `labels`, `milestone`, `estimate`, `assignee`, iteration:** **remote wins**, with an inbox notice. GitHub is the team's shared board, and these are cheap to redo.

### 5.3 Transport and budget

- **All calls go through `gh api graphql`** via `Platform.process`. Floatt reuses the user's `gh` login and stores no token. This is desktop-only.
- **One sync owner device** (a device config flag) runs the GitHub loop. Other devices see the result through the vault sync, which avoids two devices racing the same issue.
- **Pull:**
  - Repo issues use `updated:>{lastPull}` (a REST `since=` or search query, cheap).
  - Project items are paginated 100 per page and compared on `updatedAt`.
  - Polling is on a schedule (default 5 min) plus a manual "Sync now". There's no per-command polling; see the workspace's rate-limit lesson in `F-workspace-reference.md` (a hook made about 30 calls per Bash command).
- **Push:** debounced 10 s after a local change, batched into one GraphQL request with aliased mutations (`updateIssue`, `updateProjectV2ItemFieldValue`, `addSubIssue`).
- **Import:** "Link project" lists the ProjectV2 fields, auto-maps any Status options whose names match, and asks about the rest.

---

## 6. Many tasks across many projects

### 6.1 Run records that survive restarts

`projects/<p>/runs/<date>-<slug>-<short>.md`. The file is created at **enqueue** time, so a queued run is durable from the start.
```yaml
---
id: r7Hk2…
task: k3x9Qm2LpA7c
status: queued        # queued | starting | running | needs-input | succeeded | failed | cancelled | interrupted
priority: 0
queuedAt: 2026-10-08T10:12:00Z
startedAt: null
endedAt: null
device: abappi-mbp    # runs execute where the worktree is
agent: claude-code
model: opus
sessionId: 5b0c…      # pre-assigned with `claude --session-id`, so resume works before the first event
kitHash: sha256:…     # which kit build was applied
branch: vault-12-reconciler
worktree: ~/Floatt-work/worktrees/floatt/vault-12-reconciler
turns: 3
costUsd: 0.84
exitCode: null
pr: null
---
## Summary
(written at the end: from the agent's final message, edited by the user)
```

**How a run survives a restart:**
- Each **turn** is one process: `claude -p … --resume <sessionId> --output-format stream-json`.
- Its stdout goes to `appData/runs/<id>/turn-<n>.jsonl` and is spawned **detached** in its own process group, with a `pid` file.
- Floatt tails the log file and doesn't hold a pipe, so quitting Floatt doesn't kill the agent. On launch, Floatt re-attaches by tailing again.
- A reply is just the next turn, so no persistent stdin is needed.

**Startup recovery** for runs where `device == me`:
- `running` with a live PID: re-tail.
- `running` with a dead PID: mark `interrupted` and offer *resume*.
- `queued`: put back in the queue.

Other devices show the run read-only, labelled "on abappi-mbp".

### 6.2 Queues

- **Per project:** queued runs for that project, ordered by `priority`, then `queuedAt`. Concurrency is capped by `project.agents.maxConcurrent`.
- **Global:** a device-config `maxConcurrentRuns`.
- **Tasks with `dependsOn`** wait until every dependency is `done` or merged, which gives the suggested merge order from the workspace lessons.
- **The scheduler** is one runtime hook, `useRunScheduler`, mounted in the desktop module the way `useReminders` is mounted in `AppShell`. It's a pure `pickNext(queued, running, limits) → runIds` (tested) plus a loop that reacts to `runs` changes.

### 6.3 The global index

There's one `floatt-index` across all projects, so cross-project queries come for free.

```ts
// queries/command-centre.query.ts
export const getActiveRuns = () =>
  db.runs.where("status").anyOf("starting", "running", "needs-input").toArray();
export const getQueue = () =>
  db.runs.where("[status+queuedAt]").between(["queued", ""], ["queued", "￿"]).toArray();
export const getInFlightTasks = () =>
  db.tasks.where("status").anyOf("doing", "review").toArray();
export const getProjectSummaries = async () => /* per subgroup: counts by status, active runs, queue length, derived PR/CI */ ;
```

### 6.4 The attention inbox

`inbox` rows are **derived** whenever their sources change. Each key is stable (`run:<id>:needs-input`) so dismissals persist:
- runs that need input, failed or were interrupted
- a run whose PR is ready to approve (the workspace's "approve the exact text" step)
- GitHub sync conflicts and remote-wins notices
- vault `problems` (invalid files, sync-tool conflict copies, duplicate IDs)
- library drift ("kitten-bot differs in 3 repos")
- overdue tasks and reminders

The query is `inbox` minus `inboxState.dismissed`, sorted by severity, then time.

### 6.5 Screens on the existing shell (no router)

Extend `ListSelection` in `types/smart-list.type.ts` and `ui.store.ts`, and keep the three-panel `TodoScreen` layout:

```ts
type ListSelection =
  | { kind: "smart"; id: SmartListId }                                   // today
  | { kind: "subgroup"; id: string; tab?: "list" | "board" | "notes" | "runs" | "kit" }
  | { kind: "command-centre" } | { kind: "inbox" } | { kind: "library"; itemRef?: ItemRef };
// plus ui.store: selectedRunId, focusTaskId
```

| Screen | Shell placement |
|---|---|
| **Command Centre** (global) | A sidebar entry above My Day. Main panel: project cards (counts, active runs, queue, PR and CI state), a live **runs strip**, and the attention list. The detail panel opens the selected run or task. |
| **Inbox** | A sidebar entry with a count badge. Main: the attention list. Detail: the item, for example a conflict diff. |
| **Project board** | The project's `board` tab in main: `statuses` columns using the dnd-kit sortable that `sortable-task-list.component.tsx` already uses. A drop sets `status` (one file write). |
| **Task focus view** | Today's `TaskDetail`, opened full width (`focusTaskId`): body, steps, sub-issues, milestone, time, and the task's runs, PR draft and "Run agent". |
| **Agent run view** | The detail panel, or full main with `selectedRunId`: a stream-json event log, a reply box (the next turn), the worktree diff, "Open in VS Code" (`code <worktree>` via the process allowlist) and cancel. Later it can pop out into a second Tauri window. |
| **Library / kit builder** | A sidebar entry, plus the project's `kit` tab (section 1.8). |

Desktop-only entries are added to the sidebar by the injected modules (section 7.1). The web never sees them.

---

## 7. Module plan

### 7.1 Packages (following the sibling-package and suffix rules)

```
packages/
  config/        unchanged
  vault/         @floatt/vault: VaultFs type, md+frontmatter (de)serialise, entity schemas,
                 reconcile util, index db (floatt-index), migration v1→files. No React. Heavily tested.
  app/           @floatt/app: shell + Tasks/Projects/Board/Inbox/Command Centre (all are views over
                 the same index). services/ now write via vault; queries/hooks mostly unchanged.
                 New subpath exports: ./ui, ./stores, ./hooks for sibling packages.
  library/       @floatt/library: section 1.8 (browse/edit everywhere; import/materialise desktop).
  agents/        @floatt/agents: desktop-only. run.service (enqueue/turns/recovery), scheduler,
                 git.service (worktrees, branch, ahead/behind via `git`), github-sync.service (`gh`),
                 backup.service (Drive), run view, command-centre runs strip. Orchestrator lives here
                 until it outgrows it.
  notes/         @floatt/notes: later; notes/decisions editor (plain textarea first, like
                 components/task-detail/notes-editor.component.tsx).
```

- **No `packages/boards` and no `packages/orchestrator`.** A board is a view mode of a project, and the orchestrator is a scheduler plus run services. Split them out only if they grow.
- **The cycle is broken by injection.** `App` gains a `modules` prop (`{ id, sidebarItems, Screen, useRuntime }[]`). `apps/desktop/src/main.tsx` passes `[libraryModule, agentsModule]`, and `apps/web` passes `[libraryModule]`. Siblings import `@floatt/app/ui`, `@floatt/app/platform` and so on; `@floatt/app` never imports them.
- **File names follow the table in `CLAUDE.md`**, e.g. `run.service.ts`, `run.query.ts`, `use-active-runs.ts`, `run.schema.ts`, `run.type.ts`, `command-centre.screen.tsx`, `run-log.component.tsx`.

### 7.2 Platform additions

```ts
// packages/vault/src/types/vault-fs.type.ts  (vault defines it; Platform references it, so no cycle)
export interface VaultEntry { path: string; mtimeMs: number; size: number }
export type VaultChange = { path: string; kind: "upsert" | "delete" };
export type WriteResult = { ok: true; hash: string } | { ok: false; conflict: { hash: string; content: string } };
export interface VaultFs {
  rootLabel(): Promise<string | null>;
  pickRoot(): Promise<string | null>;             // desktop: native dialog *in Rust*; web: no-op
  scan(): Promise<VaultEntry[]>;
  read(path: string): Promise<{ content: string; hash: string } | null>;
  write(path: string, content: string, expectHash?: string | null): Promise<WriteResult>;
  remove(path: string): Promise<void>;            // → .floatt/trash
  move(from: string, to: string): Promise<void>;
  watch(onChange: (c: VaultChange[]) => void): () => void;
}

// packages/app/src/platform/platform.type.ts
export type AllowedCommand = "claude" | "git" | "gh" | "code";
export interface PlatformProcess {
  run(cmd: AllowedCommand, args: string[], o: { cwd: string }): Promise<{ code: number; stdout: string; stderr: string }>;
  startTurn(o: { runId: string; turn: number; cwd: string; args: string[] }): Promise<{ pid: number; logPath: string }>; // detached claude
  tail(logPath: string, from: number, onLines: (lines: string[], offset: number) => void): () => void;
  isAlive(pid: number): Promise<boolean>;
  kill(pid: number): Promise<void>;               // process group
  pickRepo(): Promise<{ projectLocalPath: string } | null>;  // native dialog, registers an allowed cwd root
}
export interface Platform {
  notifications: PlatformNotifications; opener: PlatformOpener; window: PlatformWindow; menu: PlatformMenu;
  vault: VaultFs;                  // web: IndexedDB key-value impl (~40 lines over a Dexie `files` table)
  process?: PlatformProcess;       // desktop only; absent ⇒ agent/sync/import/backup UI hidden
  backup?: PlatformBackup;         // desktop only; section 8
}
```

Git is a TS service over `process.run("git", …)`, not a separate capability. The PTY for an embedded interactive terminal (`portable-pty` + xterm.js) is left out until stream-json turns prove insufficient.

### 7.3 Rust versus TypeScript

| Rust (`src-tauri/src/{vault,process,backup}.rs`) | TypeScript |
|---|---|
| Path jail (canonicalise, `starts_with(root)`, reject `..`, absolute paths, symlink escapes), atomic writes, hashing, recursive scan, `notify` watcher | Parsing and serialising, Zod schemas, reconcile, index updates, all business rules |
| Vault root and repo roots **chosen only through Rust-side native dialogs** and stored in `appConfigDir` | The UI asks Rust to open a picker; it can never pass a root |
| A spawn allowlist (`claude`, `git`, `gh`, `code`); `cwd` must sit under a registered repo or worktree root; detached turns; log tail; kill the process group | Building arguments (kit `--plugin-dir`, `--session-id`, `--resume`, `--permission-mode`), the run state machine, the scheduler |
| Library source reads under fixed roots (`~/.claude`, linked repos, pack cache) | Import mapping, resolveKit, the materialise map |
| Zip, encrypt and the Drive upload; OAuth loopback; keychain | Backup schedule, retention policy, restore UI |

- **Commands:** narrow custom commands, not the generic `tauri-plugin-fs` or `tauri-plugin-shell` exposed to JS. That keeps the attack surface small and puts validation in one place.
- **Permissions:** declare the commands through an app manifest in `build.rs` and list them in `capabilities/default.json` (check the exact Tauri 2 API).
- **Plugins to add:** only `tauri-plugin-dialog`, used from Rust.
- **Cleanup:** remove `greet`.

---

## 8. Google Drive backup

- **Contents:**
  - the whole vault, library included (skipping `.floatt/trash/` optionally)
  - `local-state.json`, a hand-rolled export of the device-only Dexie data that can't be rebuilt from files (`inboxState`, the running timer, settings from localStorage such as theme and layout, and `floatt` v1 if it hasn't been migrated yet)
  - `device-config.json` with `vaultRoot`, `worktreeRoot`, local repo paths and limits, but **no tokens**
  - raw run logs only as an **opt-in**, because they may contain secrets
- **Excluded:** the `floatt-index` (rebuildable), worktrees, `kits/` and pack caches (rebuildable), and keychain items.
- **Format:** one archive per snapshot, `floatt-<vaultId>-<yyyymmdd-hhmm>.zip.age`.
  - A zip with deterministic ordering, holding a `manifest.json` (`{format:1, vaultId, schemaVersion, appVersion, device, createdAt, files:[{path, sha256, size}]}`).
  - Encrypted with **age** in passphrase mode (the `age` crate), so the user can decrypt it with the `age` CLI without Floatt.
  - A zip over a folder snapshot because Drive's API costs one request per file, while one archive is one upload (resumable for anything over 5 MB).
- **Auth:** an OAuth desktop loopback flow with PKCE and the **`drive.file`** scope, so the app only sees files it created. Backups land in a visible "Floatt Backups" folder the user can download by hand. The refresh token is kept in the keychain, and everything runs in Rust so the webview never holds the token.
- **Schedule and retention:** a backup after N changes or every 24 h, plus "Back up now". Keep the last 14 dailies and 8 weeklies.
- **Restore:**
  1. Download, decrypt, check the manifest hashes, and **restore into a new folder**. Never overwrite the current vault.
  2. If `schemaVersion` is lower than the app's, run the vault migrations (the same code as the phased migrations, with a git commit or copy first). If it's higher, refuse with "update Floatt".
  3. Import `local-state.json` and re-index.
  4. Switch `vaultRoot`.
- **New machine:** the same flow doubles as "move to a new machine" and as the safety net before the v1-to-files migration.

---

## 9. The web app's future

**Recommendation: keep it as a limited "Floatt Tasks" build. Don't drop it, and don't invest in it.**

- **Same code path.** `Platform.vault` on the web is a Dexie `files` table (path to content), so the same services, parser and index run. It keeps tasks, projects without repos, boards, notes and library browsing and editing, and it serves as the zero-install demo.
- **No agents, no GitHub sync, no import, no backup.** `process` and `backup` are absent, and the agents module isn't injected.
- **No remote control of the desktop's agents.** That would need a server, which Floatt doesn't have.
- **Later, only if asked:** a Chromium-only "Open vault folder" through the File System Access API, as a read-only viewer.
- **When to revisit dropping it:** if keeping both shells costs more than about a day per quarter.

---

## 10. Phased path

0. **Groundwork** (nothing visible changes):
   - set a strict CSP in `tauri.conf.json`
   - remove `greet`
   - fix the two direct `db` imports
   - add `@floatt/app/ui`, `./stores` and `./hooks` exports
   - add the `App` `modules` prop
   - bring `CLAUDE.md`'s Platform paragraph up to date
   - add CI (`check-types` and `test`)
1. **`packages/vault` core:** schemas, `yaml` serialise, reconcile util, in-memory `VaultFs`, and the v1 migration, all under vitest.
2. **Desktop vault in Rust:** pick root, scan, read, write (CAS), remove, move, watch. Web gets the IndexedDB `VaultFs`. Then the **Tasks services move to the vault** with a midpoint reorder, plus the `floatt-index` and the v1 migration with its dump. *First shippable:* the same app, but the data is markdown.
3. **Projects and Huly model:** `project.md` (key, statuses, components, theme), the board tab, sub-issues, milestones, labels, estimates, time logs, the command palette and the Inbox (problems and conflicts first).
4. **Library:** import from `~/.claude`, plugins, linked repos and git packs; the browser and editor; the kit builder; drift view; the `plugin` apply mode.
5. **Agents (desktop):** the process capability, detached turns, run files, recovery, the run view, the git worktree service and the Command Centre.
6. **Orchestration:** queues, limits, `dependsOn`, the scheduler, and derived git, PR and CI state in `derived`.
7. **GitHub Projects sync:** link, pull and push, three-way field merge, conflict inbox.
8. **Drive backup and restore**, then the optional vault auto-commit and the `claude-dir` apply mode.

Phases 4–5 depend on 2, and 7 depends on 3. Drive backup (8) can start right after phase 2 if migration safety is the bigger worry.

---

## 11. Risks

- **Performance.**
  - About 50 projects with 200 tasks each is roughly 10k small files. A cold index rebuild means reading every file once (expect seconds; measure in phase 1). Warm starts compare `(mtime, size)` only.
  - Linux inotify watch limits are fine at about 5 directories per project.
  - Fuse over 10k tasks is fine. A large library is where the local-AI embeddings plan pays off.
  - The run log view must virtualise long stream-json logs.
- **Schema evolution.**
  - `vault.json.schemaVersion` plus migration functions over files, run only after a git commit or a backup.
  - Prefer additive changes, never rename keys, and pass unknown keys through so agents and newer versions don't lose data.
  - The index has no migrations: it's dropped and rebuilt.
- **Security.**
  - **CSP and markdown.** Set a strict CSP, and render agent-written markdown with no raw HTML (react-markdown without rehype-raw). Otherwise XSS plus `process` equals remote code execution.
  - **Path traversal.** Rust-side jail with canonicalised paths, rejecting `..`, absolute paths, symlink escapes and Windows reserved names. Slugs are limited to `[a-z0-9-]` with a maximum of 80 characters. Fold case to catch case-insensitive collisions on macOS.
  - **Roots and the spawn allowlist.** Roots are set only through native dialogs. Spawning is limited to `claude`, `git`, `gh` and `code`, with `cwd` validated.
  - **Agents writing to the vault.** Give a run `--add-dir` only for its own project folder, not the whole vault, and default to `--permission-mode acceptEdits` inside the worktree, never `bypassPermissions`.
  - **Prompt injection.** Notes and library items are untrusted input to agents. A pack imported from git can carry hostile instructions or MCP commands, so show a diff and require the user's approval before an imported `tool`, `hook` or `command` item can be applied.
  - **Secrets.** Floatt stores none in the vault: GitHub goes through `gh`, Drive's token is in the keychain. Raw run logs stay device-local and are left out of backups by default. Before the vault is pushed to a git remote, scan notes for token patterns (`ghp_`, `sk-ant-`, `AKIA`).
- **Sync-tool quirks.**
  - iCloud's optimised storage turns evicted files into `.<name>.icloud` placeholders, so the scanner must detect and skip them and show a hint.
  - Syncthing and iCloud create conflict copies, which go to the Inbox (3.6).
  - Normalise CRLF on Windows and treat names as NFC on macOS.
- **GitHub.**
  - Rate limits: one sync owner, scheduled polling, batched mutations.
  - Collaborators reshaping Status options: the field map must be re-linked, so any option it can't map becomes an inbox item.
- **Process lifetime.**
  - Detached turns can outlive Floatt by design, so make sure "Quit and stop all agents" exists.
  - PID reuse after a reboot: check the PID's start time or command line, not just whether it's alive.
