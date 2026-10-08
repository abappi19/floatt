# F — The open-source workspace as Floatt's reference implementation

Written by master (open-source-66) from running the workspace at `/Users/abappi19/project/open-source` today. Nine axonpack issues were handled in parallel, one agent each. Seven PRs were opened (#107, #109–#113), and several of them merged the same day.

## What the workspace does today, and what each piece becomes in Floatt

| Workspace today | How it works | Floatt feature it becomes |
|---|---|---|
| `repos/<repo>` submodules (base clones) | Pristine default branch. Synced one way: upstream → fork (`gh repo sync`) → base clone (`--ff-only`). Own projects (axonpack, floatt) have no fork. | **Projects registry.** Each project has a base clone, remotes, a default branch, and its kind (fork or own). The sync runs as one button or a schedule. |
| `worktrees/<repo>/<branch>/` | One worktree per issue, made by `new-worktree.sh` (absolute paths, branch `<pkg>-<issue#>-<slug>`). Removed after the PR is raised or merged. | **Worktree manager.** Creates, names, installs, cleans up, and lists worktrees with their owner and state. |
| `_notes/tasks.md` | One row per task: repo, issue URL, worktree, Status (pending, done, PR raised), Final (merged, closed), Valid (accepted label). A hook derives these from git and GitHub. | **Task board.** The columns come from the same derived states. It syncs with GitHub Projects and never needs hand edits. |
| `draft/<repo>-<issue>-<slug>/PR.md` + `TODO.md` | The PR body only, plus a checklist with **Decide:** items. Indexed in `draft/README.md`. | **Task focus view.** A PR draft editor, a checklist, and decisions that feed the inbox. |
| `CLAUDE.md` (workspace) | Durable rules: one master, repos pristine, approvals before push or PR, no GitHub API checks, leave the git index alone, keep everything in the project. | **Instructions library and global rules.** Some are toggled per project, and new ones get added from the learning loop. |
| `.claude/skills/` (new-worktree, commit, github-contributor, changeset, master-agent) | Repeatable procedures: commit-message style, PR text style, changesets, worktree creation. | **Skills library.** Floatt ships these as a starter "contributor kit". |
| Master agent + `agentN` subagents | The master routes one issue to one agent and only coordinates. Agents report claims; the master checks them (diff, device, screenshots) before relaying. | **Orchestrator.** A master per project, or a global one. Worker runs are visible as cards. Reports have a schema with evidence attached. |
| Status format | "**agentN** issue: current step", one line per agent, then "Your decisions" with recommendations. | **Command centre view** and **attention inbox.** |
| Approval of exact text | The commit message, PR title and body, and issue text are shown in full, and nothing leaves the machine until the user says yes. | **Approval sheet.** The text is editable, sent with one click, and logged. |
| Metro dev servers on ports 8081–8087, one per worktree; one Android emulator; `adb reverse tcp:8081 tcp:<port>` to switch | Manual. The master switched for the user each time. | **Resources panel and actions.** For example "Switch app to #96 (8085)": registered by an agent, clicked by the user, run without the LLM. |
| GitHub | Pushes and PR creation through `gh api` (REST). Checks are left to the user via URLs because of the rate limit. | **One rate-limited GitHub client** for sync, PRs and CI status, shown in the UI. |

## What went wrong today (design against these)
1. **Subagents couldn't message the master** (sending to the parent's own name was refused). Status only arrived as final results, and a ping waited for the agent's next tool step. The user waited 20+ minutes on an over-scoped profiling run, asking "is it testing forever?" → we need **heartbeats, live step, time and token budgets, and cancel or narrow controls**.
2. **Long-lived processes were owned by agents.** Metro servers, the emulator and the DevTools window died or were restarted unexpectedly. Agents' background watchers tried to restart servers after their worktrees were removed → **the orchestrator owns resources, with leases and cleanup on worktree removal**.
3. **Device-switching quirk.** The Android debug app ignored `adb reverse` until `debug_http_host=localhost:8081` was written into its prefs. One agent claimed switching worked when it didn't → **verify claims, and keep per-device setup recipes as actions**.
4. **Rate limit.** A hook called the GitHub API about 30 times after every Bash command from every agent → **one client, run on schedule, local git first**.
5. **Worktree path bug.** A relative path created a worktree inside a base clone → **one owner creates worktrees, with absolute paths and validation**.
6. **The git index.** Agents unstaged or restaged the user's review snapshot → **never touch the index except right before an approved commit**.
7. **Hooks.** The repo's pre-commit ran `prettier --write` on everything after staging, which left the tree dirty. commitlint capped headers at 100 characters → **pre-format, validate the message, then commit**.
8. **Dependent PRs.** Issues #94 and #95 touched the same files, and #96 later conflicted with them only in a docs file → **a dependency graph, a suggested merge order, auto-rebase after merges**.
9. **Shared device side effects.** An agent tapped into the user's other app on the shared emulator → **sandbox device actions to the target app; screenshots as evidence**.
10. **Noise.** Duplicate completion notices and stale status → **dedupe, mark stale, show the latest only**.
11. **Scope creep in requests.** The user added scope mid-flight many times (Huly, GitHub sync, Drive, the library focus, multi-project, UX) → **briefs are editable live, and agents get additions without restarting**.

## What the user liked (keep)
- One line per agent with the current step; decisions listed with a recommendation each; acting on "yes" or "go".
- Verified reports before anything is relayed (diffs, screenshots, device checks).
- Small, separate PRs per issue, with feature docs inside the feature PR and general docs work in its own PR.
- Keep features moving: a merge shouldn't wait on unrelated docs.
- Cleaning up worktrees right after a PR is raised or merged; the workspace repo committed and pushed often.

## Typical day as flows (to turn into one-click flows)
1. Pick issues → create worktrees → assign agents.
2. The agent works → the master verifies.
3. Test on device: start Metro per worktree, switch the device, screenshots.
4. User approves the exact text → commit (pre-format) → push → PR.
5. The PR merges → fast-forward the base clone → delete the branch → remove the worktree → update the drafts and the index → commit and push the workspace.
6. Repeated asks become actions or skills ("switch Metro", "commit and raise PR", "clean worktree", "update workspace").
