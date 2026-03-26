# Write Tests

Write tests for this codebase following its Mocha + Cypress conventions.

## Unit Tests (Mocha)

Unit tests live in `test/`, named `<subject>_test.js`.

### Structure

```javascript
const assert = require("assert");
const sinon = require("sinon");
const { functionUnderTest } = require("../src/module");

describe("subject description", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("functionUnderTest", () => {
        it("should do X when Y", () => {
            // Arrange
            const input = "...";
            const expected = { ... };

            // Act
            const result = functionUnderTest(input);

            // Assert
            assert.strictEqual(result.someField, expected.someField);
        });
    });
});
```

### Rules

- One `describe` block per function or behaviour group
- One `it` per scenario — keep each test focused
- Arrange → Act → Assert in every `it` block
- Extract repeated assertions into a helper function above the `describe` block:
  ```javascript
  const assertEntry = (entry, expected, index) => {
      assert.strictEqual(entry.letter, expected.letter, `letter at index ${index}`);
      assert.strictEqual(entry.correct, expected.correct, `correct at index ${index}`);
  };
  ```
- Use `sinon.stub()` to replace module-level dependencies, restore in `afterEach`
- Use `mock-fs` to mock the filesystem for storage tests
- Test error return values explicitly:
  ```javascript
  const result = checkForWord("", "codes", wordList);
  assert.strictEqual(result.error, USER_INPUT_NOT_PROVIDED_ERROR_ID);
  ```
- Test the happy path AND at least one error/edge case per function

### Running

```bash
pnpm test
```

---

## E2E Tests (Cypress)

E2E tests live in `cypress/e2e/game/`, named `<feature>.cy.js`.

### Structure

```javascript
const FIRST_DAY_MS = 1647993600000; // 2022-03-23 00:00:00 UTC
const DAY_MS = 86400000;

describe("feature description", () => {
    beforeEach(() => {
        cy.clock(FIRST_DAY_MS + DAY_MS * 1, ["Date"]); // fix the date
        cy.intercept("/words.txt", { fixture: "words.txt" }); // mock word list
        cy.visit("/");
        cy.waitForGameReady(); // wait for game to initialise
    });

    it("does the thing", () => {
        cy.currentRow().inputCell(1).inputLetter().should("be.empty");
        cy.keyboardItem("a").click();
        cy.currentRow().inputCell(1).inputLetter().should("have.text", "a");
    });
});
```

### Custom Commands (defined in `cypress/support/commands.js`)

| Command | Description |
|---|---|
| `cy.keyboardItem(letter)` | Get an on-screen keyboard key |
| `cy.inputRow(n)` | Get the nth input row (1-based) |
| `cy.currentRow()` | Get the active input row |
| `.inputCell(n)` | Chain: get nth cell in a row |
| `.inputLetter()` | Chain: get the letter element inside a cell |
| `cy.waitForGameReady()` | Wait for the game to finish initialising |
| `cy.grantClipboardPermission()` | Grant clipboard permission in browser |

### Rules

- Always mock the clock and the word list in `beforeEach`
- Use `cy.clock()` to control which daily word is active
- Use `cy.intercept()` to control the word list (use fixtures in `cypress/fixtures/`)
- Prefer custom commands over raw `cy.get()` selectors for game elements
- Test what the user sees and does — not internal state
- Add new custom commands to `cypress/support/commands.js` for reusable selectors

### Running

```bash
pnpm cypress:run
# or open the interactive runner:
pnpm cypress open
```
