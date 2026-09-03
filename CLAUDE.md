@AGENTS.md

## Claude Code

`AGENTS.md` is the source of truth for this repo and is imported above. Put project rules
there, not here — this file holds only Claude Code specifics.

- Verifying browser behaviour in a Claude Code web session: Cypress cannot install there
  (see the environment notes in `AGENTS.md`), but Chromium is preinstalled at
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and the globally installed `playwright`
  package can drive it. Serve the repo root on a local port and script the interaction —
  that is how DOM and input-handling changes get checked without the e2e suite.
- Running `/init` here: it should keep this file a thin wrapper. Do not let it copy
  `AGENTS.md` content into this file — duplicated instructions drift apart and Claude has no
  way to tell which copy is current.
