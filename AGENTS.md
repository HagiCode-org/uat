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
```

## Key Paths

- `tests/`: Playwright test specs
- `playwright.config.ts`: Playwright configuration

## Agent Guidelines

- Keep test assertions aligned with the current implementation in target repos (e.g., `repos/site/src/components/home/InstallButton.tsx`).
- When target UI structure, menu semantics, or fallback strategies change, update corresponding UAT assertions.
- Treat this as a test-only repository; do not add application or UI code.
- Use Chromium as the default test browser.

## References

- `README.md`
