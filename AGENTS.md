# HagiCode UAT - Agent Configuration

## Root Configuration

Inherits all behavior from `/AGENTS.md` at the monorepo root. Local rules extend or override the root file for this repository.

## Project Context

This repository contains HagiCode user acceptance tests powered by Playwright. Tests validate UI behavior of HagiCode public-facing surfaces.

## Working Directory

Run commands from `repos/uat/`.

## Key Commands

```bash
npm install
npm run playwright:install
npm test
npm run test:headed
npm run test:ui
UAT_BASE_URL=<url> npm test   # override target, default https://hagicode.com
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
