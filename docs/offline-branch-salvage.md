# Offline Branch Salvage Plan

Extracting the non-offline work from the `offline` branch (COT-57, cancelled) into
independent PRs against `master`.

**How to use this document**

1. Settle every decision in [Decisions](#decisions) first. Each has a `**Decision:**` line
   to fill in. Several work packages are blocked on a decision and say so.
2. Do the [Prep](#prep) step once.
3. Hand out [Work packages](#work-packages) A–H. Each is a self-contained brief:
   branch name, base, scope, out-of-scope, acceptance criteria.

---

## Ground truth

| | |
|---|---|
| Branch under review | `offline` @ `50ac498` |
| Base | `origin/master` @ `a864999` |
| Merge base | `7e91c42` |
| Commits ahead / behind | 24 / 24 |
| Net diff | `+1645 / −94` across 32 files |
| Linear issue | [COT-57](https://linear.app/coteh/issue/COT-57/add-offline-support-to-wordle-clone) — Cancelled 2026-08-25 |

Commands used throughout:

```sh
pnpm test           # mocha unit tests
pnpm build          # sh ./scripts/build.sh
pnpm devs           # HTTPS dev server on :5501
pnpm cypress:run    # cypress run --spec 'cypress/e2e/**/*.cy.js' --browser chrome
```

### The headline

Only four of the eight packages are clean `git cherry-pick`s. The non-offline work
wasn't developed *alongside* the service worker, it was developed *inside* it:

- `renderPromptDialog` and the `#prompt-dialog-content` template were born in
  `5c77e89` "Add functionality to discard previous caches when app is updated" —
  the same commit that added the update-refresh flow to `sw.js`.
- The dialog manager commit `e30b8f1` also edits `offline.cy.js`.
- The version-prompt commit `2b4b9bb` also edits `scripts/transform_sw.sh`.

So packages E–H are **hand-assembled**: branch off `master`, `git checkout <sha> -- <paths>`,
then prune the service-worker lines. Packages A–D really are clean picks.

### Not in scope

The COT-57 checklist mentions pnpm, mkcert scripts and the dev watch server. Those are
**already on `master`** — they are not part of this branch's diff and need no extraction.

---

## Decisions

Fifteen calls to make before work starts. Recommendations are given, but they're
recommendations.

| # | Decision | Blocks | Recommended |
|---|---|---|---|
| D1 | Prompt dialogs don't dim browser chrome | E | Fix in E |
| D2 | `DialogManager.show()` deep-clones content | F, G, H | Stop cloning, delete `rehydrate` |
| D3 | Two Cypress tests that literally `throw` | G | Delete them |
| D4 | Keep `goOffline` / `goOnline` test helpers? | — | Keep, as generic helpers |
| D5 | Rebase strategy against 24 commits of drift | Prep, all | Rebase `offline` once |
| D6 | Prettier conformance of extracted code | all | Format touched files per PR |
| D7 | Empty `catch` blocks in new dialog code | E, F | Clean up in place |
| D8 | CHANGELOG entries in extracted PRs | G | Only the changelog-prompt line |
| D9 | `src/dialogManager.js` vs `src/manager/` | F | Keep flat for now |
| D10 | `serviceWorker` key in `config.json` | H | Drop it |
| D11 | `setLastVersion` / `hasPlayedPreviousVersion` bugs | G | Fix in G |
| D12 | `getConfig()` unguarded against network throw | H | Guard it in H |
| D13 | iPhone 6 squished prompt buttons | B | Land B, file follow-up |
| D14 | Where the GA stub lives | D | Hoist to global support file |
| D15 | Fate of the `offline` branch afterwards | — | Tag, then delete |

---

### D1 — Prompt dialogs don't dim the browser chrome

`renderPromptDialog` never calls `themeManager.applyDimmedThemeColor()`. `renderDialog`
calls it on every open, and `master` just shipped "Browser interface and/or status bar
colour will dim alongside the rest of the game's elements when a dialog is open"
(CHANGELOG, Unreleased). Prompt dialogs would ship as the one dialog type that doesn't dim.

- **(a)** Add the dim call on open and `applyNormalThemeColor()` on confirm/cancel, inside package E.
- **(b)** Ship E as-is, file a follow-up issue.
- **(c)** Refactor `renderPromptDialog` to reuse `renderDialog`'s shell rather than duplicating it — fixes this and the duplicated polyfill/fadeIn/overlay logic at the same time, but grows E considerably.

*Recommended:* **(a)**. (c) is the right end state but doesn't belong in an extraction PR.

**Decision:**

---

### D2 — `DialogManager.show()` deep-clones its content

`show()` does `content.cloneNode(true)`, which detaches every listener the caller
attached before calling it. That is why the `rehydrate` callback exists, and why
`e52e28e` was needed — it fixed a genuinely dead Share button in the win/lose dialogs.
The clone is also why `renderWin`/`renderGameOver` in `src/index.js` had to be rewritten
into nested `rehydrate` closures, which is most of that file's diff.

- **(a)** Port as-is. Smallest delta from the branch, and the four `save.cy.js` tests already prove it works.
- **(b)** Store the node instead of cloning. Deletes `rehydrate` entirely, shrinks the `src/index.js` diff in F and the debug-dialog code in H to a fraction of its size. Needs care: a node re-appended after being popped must still carry its listeners (it will — that's the point).
- **(c)** Clone only on re-render from the stack, keep the live node for the first show. Worst of both; listed for completeness.

*Recommended:* **(b)**. This is the largest call on the list — it changes the shape of
F, G and H. Make it before anyone starts F.

**Decision:**

---

### D3 — Two Cypress tests that literally `throw`

`cypress/e2e/game/misc.cy.js` → `describe("new version available")` contains two `it`
blocks whose entire body is `throw new Error("TODO: Implement this test")`. They cover
the service-worker update prompt.

- **(a)** Delete both, and the enclosing `describe`. They test the cancelled feature.
- **(b)** `it.skip` with a TODO comment, in case COT-57 is ever revived.
- **(c)** Implement them. Requires the service worker, so: no.

*Recommended:* **(a)**. They must not reach `master` in their current state either way —
they fail CI.

**Decision:**

---

### D4 — Keep the `goOffline` / `goOnline` Cypress helpers?

`cypress/support/commands.js` gains four commands. `clearServiceWorkers` and
`clearServiceWorkerCaches` are clearly offline-only. But `goOffline`/`goOnline` are
generic CDP network-emulation helpers (adapted from the Cypress blog) with uses beyond
service workers — testing fetch-failure paths for `words.txt` or the changelog, for one.

- **(a)** All four die with the branch.
- **(b)** Keep `goOffline`/`goOnline` in a small standalone PR; drop the two SW ones.
- **(c)** Keep all four — the cache-clearing ones are harmless no-ops without a service worker.

*Recommended:* **(b)** only if something will actually use them soon; otherwise (a).
Unused test helpers rot.

**Decision:**

---

### D5 — Rebase strategy

`master` is 24 commits ahead, and the themes-pane work touched the same files this
branch touches: `src/index.js`, `index.css`, `index.html`, `cypress/e2e/game/settings.cy.js`,
`cypress/e2e/game/theme.cy.js`.

- **(a)** Rebase `offline` onto `master` once into a scratch branch (`offline-rebased`), resolve the conflicts a single time, and extract every package from *that*. One conflict resolution, eight clean extractions.
- **(b)** Extract each package straight from the original SHAs onto fresh branches off `master`, resolving conflicts per PR. Eight smaller resolutions, more total work, more chance of divergent resolutions.
- **(c)** Merge `master` into `offline`. Same effect as (a) but leaves a merge commit in the history everyone extracts from.

*Recommended:* **(a)**. The scratch branch is throwaway; nothing ships from it directly.

**Decision:**

---

### D6 — Prettier conformance

`master` added `.prettierrc` after the merge base, and `979bcb6` reformatted `index.css`.
The branch's code predates that config.

- **(a)** Each package runs Prettier over the files it touches, so PRs land conformant.
- **(b)** Extract raw, do one formatting pass afterwards.
- **(c)** Format the whole repo first, then extract.

*Recommended:* **(a)**. Note this makes B's diff noisier than the two-line change it
logically is — worth a line in the PR description.

**Decision:**

---

### D7 — Empty `catch` blocks

The new dialog code uses `try { … } catch (e) {}` in three places, and one single-line
`catch (err) {}` in `render.js`'s fallback path. That's out of character for the
surrounding code and hides real failures.

- **(a)** Clean up during E and F: log with `console.error`, or drop the `try` where the guarded call can't throw.
- **(b)** Leave as-is; extraction PRs shouldn't editorialise.

*Recommended:* **(a)**. Several of these guard `dialog.close()` on a `<dialog>` that may
not be open — that case should be checked, not swallowed.

**Decision:**

---

### D8 — CHANGELOG entries

Three branch commits (`8b117e2`, `5c38f40`, `98a0546`) added two lines to the
Unreleased → Added block: "Offline support" and "Prompt player to view changelog when
game is updated".

- **(a)** Only the changelog-prompt line survives, added in G. The debug menu (H) and dialog manager (F) are internal, not user-facing.
- **(b)** Add entries for F and H too.
- **(c)** No CHANGELOG changes in any extracted PR; do one pass at release time.

*Recommended:* **(a)**.

**Decision:**

---

### D9 — `src/dialogManager.js` vs `src/manager/`

Open checklist item: "Move dialog manager to new `src/manager` subdirectory?" Note that
`index.html` loads every script with an explicit `<script src>` tag, so a move means
touching that too.

- **(a)** Keep flat at `src/dialogManager.js`, matching `src/render.js`, `src/game.js`, `src/datetime.js`.
- **(b)** `src/manager/dialog.js`, following the `src/storage/` and `src/theme/` precedent.

*Recommended:* **(a)** for now. Revisit when there's a second manager. The
checklist notes a future "replace" option for minesweeper-clone's settings flow — if
that's near-term, (b) ages better.

**Decision:**

---

### D10 — The `serviceWorker` key in `config.json`

`run_dev_server.sh` writes `"serviceWorker": false`, `src/index.js` reads it to skip
registration, and 15 Cypress intercepts across 13 spec files set it.

- **(a)** Drop the key everywhere. `config.json` ships with `debugMenu` only.
- **(b)** Keep it as a dormant no-op in case COT-57 is revived.

*Recommended:* **(a)**. A config key nothing reads is a trap. Note that the intercepts
must be updated regardless — see the file list in package H.

**Decision:**

---

### D11 — Two small bugs in the version-prompt code

In `src/storage/browser.js`:

```js
const hasPlayedPreviousVersion = () => {
    const lastVersion = window.localStorage.getItem(LAST_VERSION_KEY);
    const hasPlayedBefore = !checkFirstTime();
    return hasPlayedBefore && (!!!lastVersion || lastVersion !== GAME_VERSION);
};

const setLastVersion = (version) => window.localStorage.setItem(LAST_VERSION_KEY, GAME_VERSION);
```

`setLastVersion` ignores its `version` argument and writes `GAME_VERSION` regardless.
Harmless today (both call sites pass `GAME_VERSION`), a trap the moment anyone passes
something else. `!!!lastVersion` is `!lastVersion` with two redundant negations. The
`|| lastVersion !== GAME_VERSION` clause also makes the first half redundant.

- **(a)** Fix both in G — either honour the parameter or drop it and make the function take none.
- **(b)** Leave; extraction PRs shouldn't editorialise.

*Recommended:* **(a)**, dropping the unused parameter.

**Decision:**

---

### D12 — `getConfig()` is unguarded against a network throw

```js
const getConfig = async () => {
    const configResp = await fetch("/config.json");
    if (configResp.status >= 400) { … return {}; }
    return await configResp.json();
};
```

It handles HTTP ≥ 400 but not a rejected `fetch` or malformed JSON. It's the first
`await` in the `DOMContentLoaded` handler, so a throw takes the whole game down before
`initGame` runs.

- **(a)** Wrap in `try/catch`, return `{}` on any failure, in package H.
- **(b)** Leave as-is — `config.json` is served from the same origin and always written by the build.

*Recommended:* **(a)**. "Always written by the build" is exactly the assumption that
breaks on a partial deploy.

**Decision:**

---

### D13 — iPhone 6 squished prompt buttons

Unticked on the COT-57 checklist: "Fix prompt dialog buttons squished on iPhone 6". It's
a consequence of B's padding change.

- **(a)** Land B, file a follow-up issue, fix separately.
- **(b)** Fix inside B before it ships.
- **(c)** Hold B until the fix exists.

*Recommended:* **(a)**. B improves the share/clipboard buttons on `master` today; the
prompt dialog it was written for doesn't exist there yet, so the narrow-viewport case
isn't reachable until E lands.

**Decision:**

---

### D14 — Where the Google Analytics stub lives

The branch adds one line to `misc.cy.js`:

```js
cy.intercept('https://www.google-analytics.com/**', { statusCode: 200, body: {} }).as('ga');
```

`cypress.config.js` already sets `blockHosts: ["*.google-analytics.com"]`, which is what
*produces* the 503s; returning an empty 200 instead is what quiets them. Every spec has
the problem — only `misc.cy.js` got the fix.

- **(a)** Copy the line as-is into `misc.cy.js`, matching the branch.
- **(b)** Hoist to a global `beforeEach` in `cypress/support/e2e.js` so every spec benefits.
- **(c)** Add a `cy.stubAnalytics()` command in `commands.js`, called explicitly per spec.

*Recommended:* **(b)**.

**Decision:**

---

### D15 — Fate of the `offline` branch

Once A–H are extracted, everything left is service-worker code.

- **(a)** Tag it (`archive/offline-cot-57`) and delete the branch.
- **(b)** Leave it in place indefinitely.
- **(c)** Delete outright.

*Recommended:* **(a)**. COT-57's notes are worth keeping reachable; the branch head
isn't worth keeping in the branch list.

**Decision:**

---

## Prep

**Blocked on:** D5

Assuming D5(a):

```sh
git fetch origin master
git checkout -b offline-rebased offline
git rebase origin/master
# resolve conflicts once — expect them in:
#   src/index.js      (themes pane vs. dialog call sites)
#   index.css         (theme cards + 979bcb6 reformat vs. button sizing)
#   index.html        (themes pane markup vs. new templates)
#   cypress/e2e/game/{settings,theme}.cy.js
pnpm test && pnpm cypress:run   # expect the two throwing tests to fail — see D3
```

`offline-rebased` is a scratch branch. Nothing ships from it; every package branches off
`master` and takes files from it.

---

## Work packages

Dependency order: **A · B · C · D** are independent of each other and can run in
parallel. **E → F → G → H** is a chain.

```
A ─┐
B ─┤
C ─┼─→ E → F → G
D ─┘             └→ H
```

Every package below assumes: branch off `origin/master`, one PR, and the standard
acceptance bar of `pnpm test` and `pnpm cypress:run` green.

---

### A · Move engine tests into `cypress/e2e/engine/`

| | |
|---|---|
| **Type** | Clean lift |
| **Branch** | `refactor/engine-test-folder` |
| **Depends on** | nothing |
| **Decisions** | D6 |
| **Size** | Trivial |

Pure rename: `cypress/e2e/game/dialog.cy.js` → `cypress/e2e/engine/dialog.cy.js`,
separating engine-level specs from game specs so they can eventually move to the
engine's own suite. Zero behavioural change.

**Source:** the rename half of `e30b8f1`.

**Scope:** the file move only.

**Out of scope:** the dialog-stacking tests that `e30b8f1` adds to the same file — those
belong to F.

**Notes:** `cypress.config.js` uses the default `specPattern`, so the new folder is
picked up with no config change. Verify that assumption holds when the suite runs.

**Acceptance:** `pnpm cypress:run` discovers and passes `cypress/e2e/engine/dialog.cy.js`;
no file remains at the old path.

---

### B · Bigger dialog buttons, icon-less label spacing

| | |
|---|---|
| **Type** | Clean lift |
| **Branch** | `fix/dialog-button-sizing` |
| **Depends on** | nothing |
| **Decisions** | D6, D13 |
| **Size** | Trivial |

`button.button` gains vertical padding (`0.5em` → `1em`) and an explicit
`font-size: 0.85rem`; `.dialog button > span:only-child` drops the 8px left margin that
only makes sense when an icon sits beside the label. Written for the prompt dialog, but
it lands visibly on the existing share and clipboard buttons, so it stands alone on
`master` today.

**Source:** `212567f`, `6a9e50f` — both `index.css` only.

**Scope:** `index.css`.

**Notes:**
- Expect context conflicts from `979bcb6`'s reformat even though the rules don't overlap logically. `git cherry-pick -X patience` or a manual apply.
- Per D6, the Prettier pass will make the diff larger than the two logical changes. Say so in the PR description.

**Acceptance:** share and clipboard buttons render taller with correctly-centred labels
in the win and lose dialogs; `pnpm cypress:run` green (screenshot specs included).

---

### C · `GAME_NAME` / `GAME_VERSION` constants

| | |
|---|---|
| **Type** | Clean lift |
| **Branch** | `refactor/game-version-constant` |
| **Depends on** | nothing |
| **Decisions** | D6 |
| **Size** | Small |

The version string is currently hardcoded three times in `index.html` — the Sentry
`release`, the `gtag` event, and the visible version span — and `bump.sh` keeps them in
sync with three separate `sed` rules. This hoists two constants to the top of the inline
script, points Sentry and gtag at them, logs `wordle-clone v1.4.0` on boot, and collapses
`bump.sh` to one rule.

**Source:** the `index.html` + `scripts/bump.sh` subset of `2b4b9bb`.

**Scope:** `index.html`, `scripts/bump.sh`.

**Out of scope:** the `sw.js` sed rule that `2b4b9bb` also adds to `bump.sh`. Everything
else in `2b4b9bb` belongs to G.

**Notes:** this PR *deletes* the `bump.sh` rule that rewrote `"version": "…"` in
`index.html`. Before merging, grep `index.html` for any surviving bare `1.4.0` literal —
if one is left behind, the next `bump.sh` run will silently skip it.

**Acceptance:** `sh ./scripts/bump.sh 1.4.1` rewrites the version span, `GAME_VERSION`,
and `package.json` consistently, and leaves no stale literal. Sentry `release` and the
`game_open` gtag event both report the new version at runtime.

---

### D · Stub Google Analytics in Cypress

| | |
|---|---|
| **Type** | Clean lift |
| **Branch** | `test/stub-analytics` |
| **Depends on** | nothing |
| **Decisions** | D14 |
| **Size** | Trivial |

`cypress.config.js`'s `blockHosts` produces GA 503s in the test output; intercepting with
an empty 200 quiets them.

**Source:** one line in `misc.cy.js` from `7f52982`.

**Scope:** per D14 — either `misc.cy.js` alone, or `cypress/support/e2e.js` for all specs.

**Acceptance:** no `google-analytics.com` 503s in `pnpm cypress:run` output.

---

### E · Prompt dialog primitive

| | |
|---|---|
| **Type** | Hand extraction |
| **Branch** | `feat/prompt-dialog` |
| **Depends on** | nothing (pairs well with B) |
| **Decisions** | D1, D6, D7 |
| **Size** | Medium |

A yes/no dialog: `renderPromptDialog(content, options)` with `onConfirm` / `onCancel`
callbacks, a `#prompt-dialog-content` template, the shared `fadeIn` transition, and the
`dialog-polyfill` registration that `renderDialog` already does.

**Source:** `5c77e89` — **`src/render.js` and `index.html` only** — then `6f0f331`
(fadeIn) and `99b7f0f` (polyfill).

**Scope:** `src/render.js`, `index.html`.

**Out of scope — this is the trap in this package.** `5c77e89` is
"Add functionality to discard previous caches when app is updated". It also touches
`sw.js`, `src/index.js` (the `registerServiceWorker` update flow) and `README.md`. Take
*only* the two files above.

**Required fixes (D1, D7):**
- Call `themeManager.applyDimmedThemeColor()` on open and `applyNormalThemeColor()` on confirm/cancel, matching `renderDialog`.
- Replace the empty `catch` blocks.

**Notes:** nothing calls `renderPromptDialog` yet when this lands — that's fine, F and G
are the callers. If a caller-less function is unacceptable in review, hold E and merge it
into F.

**Acceptance:** a manual `renderPromptDialog` invocation from the console renders,
dims the chrome, fires both callbacks, and cleans up the overlay. Existing dialog specs
stay green.

---

### F · Dialog manager and stacking system

| | |
|---|---|
| **Type** | Hand extraction |
| **Branch** | `feat/dialog-manager` |
| **Depends on** | **E**, **A** |
| **Decisions** | **D2**, D6, D7, D9 |
| **Size** | Large — the main event |

The biggest and most reusable thing on the branch. `window.DialogManager` holds a LIFO
stack with a `processImmediate` flag: an immediate dialog preempts whatever is showing and
pushes it down; a non-immediate one queues behind. `renderDialog`'s close button and the
overlay click both delegate to `DialogManager.closeCurrent()`, which pops the next item.
Every `renderDialog` call site in `src/index.js` and `src/share/browser.js` moves over.

**Source:** `e30b8f1` (minus the rename, which is A, and minus `offline.cy.js`),
plus `c1229db` and `e52e28e`.

**Scope:** `src/dialogManager.js` (new), `src/render.js`, `src/index.js`,
`src/share/browser.js`, `index.html`, `cypress/e2e/engine/dialog.cy.js`.

**Out of scope:** `cypress/e2e/game/offline.cy.js`, and the debug dialog (H) — even
though `e30b8f1` touches both.

**Rides along, keep it here:** `c1229db` shows `initGame` error dialogs with
`immediate = true`, so a fatal error isn't queued behind a win dialog. That's correct
behaviour and belongs with the manager.

**Blocked on D2.** If D2 lands on (b) — stop cloning — then `e52e28e`'s `rehydrate`
callback is not ported, and `renderWin` / `renderGameOver` keep their current shape on
`master` with only the final `renderDialog(…)` call swapped for `DialogManager.show(…)`.
That is a dramatically smaller diff. If D2 lands on (a), port `e52e28e` as written; it
fixes a real dead Share button.

**Notes:**
- Three new stacking tests land in `cypress/e2e/engine/dialog.cy.js`: immediate takes precedence, non-immediate queues behind, and listeners survive stack-and-restore. The third only makes sense under D2(a) — under D2(b) it should be rewritten to assert the listener was never lost in the first place.
- Expect `src/index.js` conflicts from the themes-pane work. Different region, but the file has drifted.
- The COT-57 notes flag a future `replace` option for minesweeper-clone's settings flow. Not in scope; worth a line in the PR description so it isn't lost.

**Acceptance:** all three stacking tests pass; win/lose Share and Copy buttons work
(this is the regression `e52e28e` was about — test it by hand as well as in CI); the
overlay click closes closable dialogs and ignores non-closable ones; `pnpm cypress:run` green.

---

### G · "What's new" prompt on version update

| | |
|---|---|
| **Type** | Hand extraction |
| **Branch** | `feat/changelog-update-prompt` |
| **Depends on** | **C**, **E**, **F** |
| **Decisions** | D3, D6, D8, D11 |
| **Size** | Medium-large |

On load, if the player has played before and the stored version differs from
`GAME_VERSION`, prompt *"Updated to version vX. Would you like to see what's new?"* and
open the changelog on confirm. Adds a `played_before` event to `initGame`, a
`wc_last_version` storage key with `hasPlayedPreviousVersion()` / `setLastVersion()`, and
extracts `openChangelog()` out of the changelog link's click handler so both paths share it.

**Source:** `2b4b9bb` minus `scripts/` (that half is C), plus the CHANGELOG line from
`98a0546`.

**Scope:** `src/game.js`, `src/storage/index.js`, `src/storage/browser.js`,
`src/index.js`, `index.html`, `CHANGELOG.md`, `cypress/e2e/game/misc.cy.js`,
`cypress/e2e/game/save.cy.js`, plus `wc_last_version` seeding in the specs that need it.

**Out of scope:** `scripts/bump.sh`, `scripts/transform_sw.sh`.

**Tests:** ten come with it — six in `misc.cy.js` covering the prompt's conditions
(played before + version changed, played before + no marker, never played, no new
version, confirm opens changelog, cancel doesn't), and four in `save.cy.js` asserting the
win/lose dialog shows first and the prompt follows once it's closed. Those four are the
real proof that F works.

**Required deletions (D3):** the `describe("new version available")` block in
`misc.cy.js` and its two `throw new Error("TODO: Implement this test")` bodies. They
test the service-worker update prompt and will fail CI.

**Required fixes (D11):** `setLastVersion` ignoring its parameter, and `!!!lastVersion`.

**Acceptance:** all ten tests pass with the two throwing ones removed; a manual pass —
set `wc_last_version` to an old value, reload, confirm the prompt appears and opens the
changelog; finish a game, reload with an old marker, confirm the win dialog shows *first*.

---

### H · `config.json` runtime config and debug menu

| | |
|---|---|
| **Type** | Hand extraction |
| **Branch** | `feat/debug-menu-config` |
| **Depends on** | **E**, **F** |
| **Decisions** | **D10**, D6, D12 |
| **Size** | Medium |

Replaces build-time JS injection with a fetched `config.json`, written by `build.sh`
(`debugMenu: true` for DEV, `{}` otherwise) and `run_dev_server.sh`, with a `serve.json`
rewrite so the dev server serves it. When `config.debugMenu` is set, a wrench icon
appears in the header opening a debug dialog with five buttons — prompt, non-closable,
notification, regular, and stacked dialogs.

**Source:** `b87a34d` + the debug-dialog parts of `e30b8f1` + `8fee8eb`, service-worker
parts removed.

**Scope:** `scripts/build.sh`, `scripts/run_dev_server.sh`, `config/serve.json`,
`src/index.js`, `index.html`, `index.css`, and the `/config.json` intercept in
**15 places across 13 spec files**:

```
cypress/e2e/engine/dialog.cy.js      cypress/e2e/game/misc.cy.js
cypress/e2e/game/gameplay.cy.js      cypress/e2e/game/save.cy.js
cypress/e2e/game/high-contrast.cy.js cypress/e2e/game/settings.cy.js
cypress/e2e/game/how-to-play.cy.js   cypress/e2e/game/share.cy.js
cypress/e2e/game/keyboard.cy.js      cypress/e2e/game/theme.cy.js
cypress/e2e/game/viewport.cy.js      cypress/e2e/game/word.cy.js
cypress/e2e/misc/screenshot.cy.js
```

(The 14th file, `cypress/e2e/game/offline.cy.js`, stays behind.)

**Required removals (D10):** the `serviceWorker` key from `run_dev_server.sh`, from the
registration branch in `src/index.js`, and from all 15 spec intercepts.

**Required fix (D12):** guard `getConfig()` against a rejected `fetch` and malformed JSON.

**Fold in, don't ship separately:** `8fee8eb` "Fix build script to use POSIX-compliant
equals operator" only applies to the `if [ "$DEPLOY_ENV" = "DEV" ]` block this package
introduces. It is meaningless without it.

**Drop:** `b0da857` adds a long comment to `run_dev_server.sh` explaining why
`transform_sw.sh` is commented out. That script isn't being extracted; don't carry a
comment about it.

**Blocked on D2** via the debug dialog's `rehydrate` callback, which is a large chunk of
this package's `src/index.js` diff and disappears entirely under D2(b).

**Acceptance:** `pnpm build` produces `build/config.json` with `{}`; `pnpm dev` produces
one with `debugMenu: true` and the wrench icon appears; all five debug buttons behave as
labelled (the "stacked dialogs" one is a useful manual smoke test for F); `pnpm cypress:run`
green with the debug link hidden.

---

## What stays behind

Offline-only. Dies with COT-57 (see D15).

- `sw.js` — the whole service worker: precache list, cache versioning by commit hash, `skipWaiting` handling, stale-cache cleanup
- `scripts/transform_sw.sh`, and the `sw.js` sed rule in `scripts/bump.sh`
- `registerServiceWorker()` and the "New version available! Refresh?" flow in `src/index.js`, including `listenForWaitingServiceWorker` and the `controllerchange` reload
- `cypress/e2e/game/offline.cy.js` — carries its own `// TODO: Fix this test`; the checklist item "Double check that precaching is actually working" is still open. It never worked. Don't try to rescue it.
- `clearServiceWorkers`, `clearServiceWorkerCaches` in `cypress/support/commands.js`, and every `cy.clearServiceWorkerCaches()` call sprinkled through the specs
- `goOffline` / `goOnline` — **unless D4 says otherwise**
- The `"serviceWorker"` key in `config.json`, `run_dev_server.sh` and all spec intercepts — **unless D10 says otherwise**
- `b0da857`'s dev-server note about `sw.js`
- CHANGELOG's "Offline support" entry
- README's "Playable offline" bullet and the PWA-offline line in the HTTPS section

**One exception worth rescuing from the README.** `57317bd` rewrites the "HTTPS Local
Development" section from a single dense paragraph into a bulleted list distinguishing
share sheet, clipboard, legacy clipboard fallback, and PWA install. Drop the PWA bullet
and the rest is a genuine clarity improvement — it can ride along with any package above,
or go up as its own one-file docs PR.

---

## Verification

Per package:

```sh
pnpm test
pnpm cypress:run
pnpm build && ls build/          # packages C and H
```

Before any package merges, confirm against `master`:

```sh
git log --oneline origin/master..HEAD          # only this package's commits
git diff origin/master...HEAD --stat           # only this package's files
grep -rn "serviceWorker\|sw\.js\|registerServiceWorker" $(git diff --name-only origin/master...HEAD)
```

That last grep should return nothing for every package except, deliberately, none of them.
