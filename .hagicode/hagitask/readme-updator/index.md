---
public: true
multilingual: false
style: product
---

# README requirements

## Product focus

- Present this repository as the HagiCode user acceptance test suite: it lets testers confirm, in a real browser, that the public site works as a visitor expects, starting with the Desktop download control on the homepage header.
- Main capability users get: a Playwright acceptance case that checks the segmented download control, its version and source menu, and that the main download action ends in a Desktop installer download or a valid fallback page.
- Address testers and maintainers who run acceptance checks; this is internal tooling with no end-user product. The README is written in Chinese; keep it in Chinese.
- Lead with what the checks verify for visitors, then how to run them.

## Required content

- Describe the current acceptance case in terms of visitor-visible behavior and the outcomes it accepts.
- Show how to run it: install, install the browser, run all tests and run the single homepage scenario.
- Document the environment variable that selects the tested site and its default value, and the user-visible assumptions the case relies on.
- Commands and variable names must match `package.json` and `playwright.config.ts`.

## Exclusions

- Exclude values of environment variables, tokens, internal hosts, machine-specific paths and private links.
- Keep repository maintenance instructions out of the README: repository layout, source-file alignment notes, internal architecture, CI, build internals and contribution workflow.
