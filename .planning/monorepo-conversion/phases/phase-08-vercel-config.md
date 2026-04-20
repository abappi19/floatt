# Phase 8 — Vercel Config

**Status:** planned

## Goal

Vercel deploys `apps/web` on every push to `main`, with preview deploys on PR branches. Desktop-only changes don't trigger web rebuilds.

## Scope

- `vercel.json` at repo root:
  ```json
  {
    "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
    "buildCommand": "cd ../.. && pnpm turbo run build --filter=@floatt/web",
    "outputDirectory": "dist",
    "ignoreCommand": "npx turbo-ignore @floatt/web",
    "framework": "vite"
  }
  ```
- Configure Vercel project manually (UI-only, not code):
  - Link the GitHub repo.
  - Set **Root Directory** to `apps/web`.
  - Framework preset: Vite.
  - Install/build/output commands are read from `vercel.json`.
- Set required env vars in Vercel dashboard (none needed today — floatt is local-first; document the placeholder for future `VITE_*` vars).
- (Optional) Connect Turbo remote cache — create a Vercel token, add `TURBO_TOKEN` + `TURBO_TEAM` as Vercel env vars and GitHub Actions secrets. Gated on open question #2.

## Deliverables

- `vercel.json`
- Vercel project linked (manual step, documented in a README snippet)

## Verification

- Push a branch to GitHub → Vercel preview URL builds and serves the app.
- Open the preview URL → Floatt loads, notifications request permission on first reminder.
- Push a commit touching only `apps/desktop/**` → Vercel skips the build (turbo-ignore returns 0).
- `main` merge → production URL deploys.

## Notes

- `turbo-ignore` returns exit code 0 (skip) when the filtered package and its deps haven't changed.
- If Vercel fails with "No output found", double-check Root Directory = `apps/web` and outputDirectory = `dist` relative to that.
