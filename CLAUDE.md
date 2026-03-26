# Claude Code Guidelines

This document describes how to write code in this codebase. Follow these conventions precisely when building features or games.

---

## Stack

- **Vanilla JavaScript (ES6+)** — no frameworks (no React, Vue, Svelte, etc.)
- **Plain CSS** with custom properties — no preprocessors, no CSS-in-JS, no CSS modules
- **Mocha** for unit tests, **Cypress** for E2E tests
- **Sinon** for mocking/stubbing, **mock-fs** for filesystem mocking
- **pnpm** as the package manager
- Build via shell scripts (`scripts/build.sh`, `scripts/run_dev_server.sh`)

---

## Project Structure

```
src/           # Source files
  game.js      # Core game logic (universal — works in browser and Node.js)
  index.js     # Browser entry point
  consts.js    # Constants
  render.js    # DOM rendering functions
  storage/     # Platform-specific storage (browser.js, cli.js)
  share/       # Platform-specific share (browser.js)
  theme/       # Theme classes
test/          # Mocha unit tests (*_test.js)
cypress/       # Cypress E2E tests
  e2e/game/   # Game-specific specs (*.cy.js)
  support/    # Custom Cypress commands
  fixtures/   # Test fixtures
```

---

## Code Style

### Naming
- **camelCase** for variables and functions: `saveGame`, `getCurrentDay`
- **CONSTANT_CASE** for constants: `STARTING_LIVES`, `FIRST_DAY`
- **PascalCase** for classes: `ThemeManager`, `WordListFetchError`
- **kebab-case** for CSS classes: `.input-row`, `.keyboard-item`
- **snake_case** with prefix for storage keys: `wc_attempts`, `wc_lives`

### Formatting
- 4-space indentation
- No semicolons are NOT enforced — follow existing file conventions
- Trailing commas in multi-line arrays and objects

### Modules
- Use CommonJS (`require`/`module.exports`) with a guard for Node.js vs browser:
  ```javascript
  if (typeof process !== "undefined") {
      module.exports = { foo, bar };
  }
  ```
- One logical concept per file
- Helper functions defined before the function that uses them (no hoisting reliance)
- Top-level requires at the top of the file

---

## Architecture

### Universal code
Core logic must work in both browser and Node.js. Platform-specific behaviour (storage, share API, clipboard) goes in separate files under `storage/`, `share/`, etc.

### State management
Simple module-level variables — no state libraries:
```javascript
let gameState = {};
let wordList = [];
```

Use spread for immutable array updates:
```javascript
gameState.attempts = [...gameState.attempts, result.results];
```

Initialize state with a plain factory function:
```javascript
const newState = () => ({
    lives: STARTING_LIVES,
    attempts: [],
    ended: false,
});
```

### Event-driven updates (observer pattern)
Game logic calls a caller-supplied `eventHandler` function rather than touching the DOM directly:
```javascript
const eventHandler = (event, data) => {
    switch (event) {
        case "init": gameState = data.gameState; break;
        case "draw": wordleRenderer.renderCheckResults(...); break;
        case "win":  gameState.ended = true; break;
    }
};
```

### Renderer object
Group all render calls in a plain object, one method per event:
```javascript
const wordleRenderer = {
    renderInitialState(attempts) { ... },
    renderCheckResults(results)  { ... },
    renderWin()                  { ... },
    renderGameOver(word)         { ... },
};
```

### Singleton classes
Use a static `getInstance()` method:
```javascript
class ThemeManager {
    static getInstance() {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }
}
```

---

## Error Handling

### Errors as return values (preferred in game logic)
Return an object with an `error` property instead of throwing:
```javascript
const checkForWord = (userInput, word, wordList) => {
    if (!userInput) return { error: USER_INPUT_NOT_PROVIDED_ERROR_ID };
    if (userInput.length !== word.length) return { error: WORDS_DIFFERENT_LENGTH_ERROR_ID };
    return { results };
};
```

Call sites check:
```javascript
const result = checkForWord(input, word, wordList);
if (result.error) {
    return eventHandler("error", result);
}
```

### Custom Error classes (for exceptional/async failures)
```javascript
class WordListFetchError extends Error {
    constructor(e) {
        super(e);
        this.name = "WordListFetchError";
    }
}
```

### Async try-catch
```javascript
try {
    await initGame(eventHandler);
} catch (e) {
    if (typeof Sentry !== "undefined") Sentry.captureException(e);
    // show error UI
}
```

### Silent fallbacks for optional APIs
```javascript
if (!navigator.clipboard) {
    return fallbackCopyShareText(shareText);
}
try {
    await navigator.clipboard.writeText(shareText);
} catch (e) {
    renderNotification("Could not copy to clipboard due to error");
}
```

---

## DOM / Rendering

Use `document.createElement` and set `className` directly — no innerHTML for dynamic content:
```javascript
const renderInputRow = (parentElem, numberOfLetters) => {
    const container = document.createElement("div");
    container.className = "input-row";
    parentElem.appendChild(container);
    return container;
};
```

Feature-detect before using browser APIs:
```javascript
if (typeof feather !== "undefined") feather.replace();
if (typeof Sentry !== "undefined") Sentry.captureException(e);
```

---

## CSS

- All styles in `index.css` (single file)
- Use CSS custom properties for theming:
  ```css
  :root { --correct-color: var(--green); }
  .light { --background-color: var(--white); }
  .high-contrast { --correct-color: var(--orange); }
  ```
- Switch themes by toggling class names on `<body>`
- Layout with **Flexbox** (primary) or **Grid** (card layouts)
- Responsive with `@media (max-width: ...)` breakpoints
- BEM-inspired class naming: `.keyboard-item`, `.keyboard-item.pressed`, `.keyboard-item.big`

---

## Testing

### Unit tests (Mocha)
- Files in `test/`, named `*_test.js`
- Use `describe()` / `it()` / `beforeEach()` / `afterEach()`
- Arrange-Act-Assert pattern within each `it()`
- Extract reusable assertions into helper functions to reduce boilerplate
- Use `sinon.stub()` for mocking, `mock-fs` for filesystem

### E2E tests (Cypress)
- Files in `cypress/e2e/game/`, named `*.cy.js`
- Mock time with `cy.clock(timestamp, ["Date"])`
- Mock network with `cy.intercept("/words.txt", { fixture: "words.txt" })`
- Use custom commands defined in `cypress/support/commands.js`
- Chain selectors: `cy.currentRow().inputCell(1).inputLetter()`

---

## Accessibility

- Add `aria-label` to icon-only buttons
- Manage focus explicitly when opening/closing dialogs
- Mark decorative/hidden elements with `ariaHidden = "true"`

---

## Commit Messages

- Lowercase imperative: `Fix`, `Add`, `Adjust`, `Combine`
- Specific: reference the exact component or behaviour
- Example: `Fix single-column layout on 360px viewports`
- Multiple changes: `Add accessible labels to icon-only buttons, and fix light theme fallback`
