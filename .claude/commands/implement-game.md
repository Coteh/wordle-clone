# Implement Game

Build a new game or game mode following this codebase's vanilla JavaScript game architecture.

## Core Architecture Decisions

This codebase separates **game logic** (universal) from **rendering** (browser) and **storage** (platform-specific). Follow the same split for any new game.

```
src/
  <game-name>.js       # Core logic — works in Node.js and browser
  render.js            # DOM rendering — browser only
  index.js             # Wires logic + renderer + events
  consts.js            # Constants
  storage/browser.js   # localStorage persistence
```

---

## Step 1: Define constants

Add all magic values to `src/consts.js` before writing logic:

```javascript
// Error IDs
const SOME_ERROR_ID = "SOME_ERROR_ID";

// Game config
const STARTING_LIVES = 6;
const WORD_LENGTH = 5;

// Storage keys (snake_case with wc_ prefix)
const LIVES_KEY = "wc_lives";
const ATTEMPTS_KEY = "wc_attempts";
```

---

## Step 2: Write core game logic

Create `src/<game>.js`. All functions must be pure or accept dependencies as parameters. No DOM access. No `localStorage` access.

```javascript
// State factory
const newState = () => ({
    lives: STARTING_LIVES,
    attempts: [],
    ended: false,
});

// Immutable state updates
const applyAttempt = (state, result) => ({
    ...state,
    attempts: [...state.attempts, result],
    lives: state.lives - (result.correct ? 0 : 1),
});

// Return errors as values — never throw from game logic
const checkGuess = (input, answer, wordList) => {
    if (!input) return { error: USER_INPUT_NOT_PROVIDED_ERROR_ID };
    if (input.length !== answer.length) return { error: WORDS_DIFFERENT_LENGTH_ERROR_ID };
    // ... compute results
    return { results };
};

// Main game action — calls eventHandler instead of touching DOM
const submitGuess = (input, state, eventHandler) => {
    const result = checkGuess(input, state.word, state.wordList);
    if (result.error) return eventHandler("error", result);

    const won = result.results.every((r) => r.correct);
    eventHandler("draw", { results: result.results });

    if (won) return eventHandler("win", {});
    if (state.lives - 1 === 0) return eventHandler("lose", { word: state.word });
    eventHandler("life-decrease", { lives: state.lives - 1 });
};

// Export with Node.js guard for testability
if (typeof process !== "undefined") {
    module.exports = { newState, checkGuess, submitGuess };
}
```

---

## Step 3: Write the renderer object

In `src/index.js`, group all DOM updates into a plain renderer object — one method per event:

```javascript
const gameRenderer = {
    renderInitialState(attempts) {
        // Build initial DOM from saved attempts
    },
    renderDraw(results) {
        // Colour the current row based on results
    },
    renderWin() {
        // Show win state
    },
    renderLose(word) {
        // Reveal answer
    },
    renderError(error) {
        // Show notification
    },
    renderLifeDecrease(lives) {
        // Update life counter
    },
};
```

---

## Step 4: Write the event handler

Wire the game logic to the renderer with a switch:

```javascript
const eventHandler = (event, data) => {
    switch (event) {
        case "init":
            gameState = data.gameState;
            gameRenderer.renderInitialState(gameState.attempts);
            break;
        case "draw":
            gameRenderer.renderDraw(data.results);
            break;
        case "win":
            gameState.ended = true;
            gameRenderer.renderWin();
            break;
        case "lose":
            gameState.ended = true;
            gameRenderer.renderLose(data.word);
            break;
        case "error":
            gameRenderer.renderError(data);
            break;
        case "life-decrease":
            gameState.lives = data.lives;
            gameRenderer.renderLifeDecrease(data.lives);
            break;
    }
};
```

---

## Step 5: Wire input

Handle both keyboard and on-screen keyboard:

```javascript
window.addEventListener("keydown", (e) => {
    if (gameState.ended) return;
    const key = e.key.toLowerCase();
    if (key === "enter") submitGuess(...);
    else if (key === "backspace") handleBackspace();
    else if (/^[a-z]$/.test(key)) handleLetter(key);
});

// On-screen keyboard — delegate to same handlers as physical keyboard
const handleKeyInput = (key) => { ... };
```

---

## Step 6: Add CSS

Extend `index.css` — do not create a new CSS file:

```css
/* New game-specific elements */
.game-board {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.cell {
    width: 62px;
    height: 62px;
    border: 2px solid var(--standard-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: var(--text-color);
    background-color: var(--background-color);
}

.cell.correct { background-color: var(--correct-color); }
.cell.within  { background-color: var(--within-color); }
.cell.wrong   { background-color: var(--wrong-color); }
```

---

## Step 7: Persist state

Use the existing storage interface in `src/storage/browser.js`:

```javascript
const saveGame = (state) => {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(state.attempts));
    localStorage.setItem(LIVES_KEY, String(state.lives));
};

const loadGame = () => {
    const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "[]");
    const lives = Number(localStorage.getItem(LIVES_KEY) || STARTING_LIVES);
    return { attempts, lives };
};
```

---

## Step 8: Test

Write unit tests for all game logic functions (see `/write-tests`):
- `newState()` returns the correct defaults
- `checkGuess()` returns correct/within/wrong for each letter case
- `checkGuess()` returns the right error ID for invalid inputs
- `submitGuess()` calls `eventHandler("win")` on a correct guess
- `submitGuess()` calls `eventHandler("lose")` when lives reach zero

Write Cypress E2E tests for user-facing flows (see `/write-tests`):
- Typing and submitting a guess
- Winning the game
- Losing the game
- Hard mode / special rules if applicable
- Game state persisting on page reload

---

## Checklist

- [ ] All constants in `consts.js`
- [ ] Game logic has no DOM or storage access
- [ ] All errors returned as `{ error: ERROR_ID }` — not thrown
- [ ] Events flow through `eventHandler`
- [ ] Renderer object has one method per event
- [ ] CSS uses custom properties for colours
- [ ] State persists to localStorage
- [ ] Module exported with `if (typeof process !== "undefined")` guard
- [ ] Unit tests pass (`pnpm test`)
- [ ] E2E tests pass (`pnpm cypress:run`)
