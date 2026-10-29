# HagiCode UAT - Agent Configuration

## Root Configuration

Inherits all behavior from `/AGENTS.md` at the monorepo root. Local rules extend or override the root file for this repository.

## Project Context

This repository contains HagiCode user acceptance tests powered by Playwright. Tests validate UI behavior of HagiCode public-facing surfaces.

## Working Directory

Run commands from `repos/uat/`.

## Key Commands

```bash
pnpm install
pnpm run playwright:install
pnpm test
pnpm run test:headed
pnpm run test:ui
UAT_BASE_URL=<url> pnpm test   # override target, default https://hagicode.com
```

## Key Paths

- `tests/`: Playwright test specs (currently `site-download.spec.ts`, the site download entry coverage)
- `playwright.config.ts`: Playwright configuration (`UAT_BASE_URL` sets the target site; single `chromium` project; in CI 2 retries, 2 workers, trace/video kept on failure)
- `.github/workflows/uat-playwright.yml`: CI run (Node 24, headed Chromium under xvfb, every 4 hours plus on changes to tests/config; manual runs accept a `base_url` input, otherwise `UAT_BASE_URL` var/secret)
- `playwright-report/`, `test-results/`, `blob-report/`: generated output, gitignored; do not commit

## Agent Guidelines

- Keep test assertions aligned with the current implementation in target repos (e.g., `repos/site/src/components/home/InstallButton.tsx`).
- When target UI structure, dialog/menu semantics (the header toggle currently opens a `role="dialog"` platform picker), or fallback strategies change, update corresponding UAT assertions.
- Treat this as a test-only repository; do not add application or UI code.
- Use Chromium as the default test browser.

## References

- `README.md`

## Package management

- The repository uses pnpm, pinned in `package.json` `packageManager`. Run `corepack enable` once, then `pnpm install`. `pnpm-lock.yaml` is the only lockfile; do not commit `package-lock.json`.
- Settings live in `pnpm-workspace.yaml`. `allowBuilds` lists the dependencies whose install scripts may run (reviewed individually, `false` means reviewed and denied); review any new dependency that has an install script and add it there.
- A local registry mirror belongs in `~/.npmrc` only. Never commit a `registry=` line or a mirror URL; `pnpm run check:registry` (also run in CI) fails on any non-`registry.npmjs.org` `tarball` in the lockfile and on mirror hosts in tracked files.
- Undeclared imports fail under pnpm's strict layout: declare the package instead of hoisting it.
