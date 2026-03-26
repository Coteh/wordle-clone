# Add Feature

Add a new feature to this codebase following the project's vanilla JavaScript conventions.

## Steps

1. **Read CLAUDE.md** to confirm naming and architecture conventions before writing any code.

2. **Identify where the logic belongs:**
   - Pure game/domain logic → `src/game.js`
   - DOM rendering → `src/render.js`
   - Browser-specific behaviour (storage, share, clipboard) → `src/<domain>/browser.js`
   - CLI-specific behaviour → `src/<domain>/cli.js`
   - Shared constants → `src/consts.js`
   - Date/time helpers → `src/datetime.js`
   - Preferences → `src/preferences.js`

3. **Write the logic as plain functions** — no classes unless a singleton is needed (use `static getInstance()`).

4. **Return errors as values in game/domain logic** — do not throw:
   ```javascript
   if (!input) return { error: SOME_ERROR_ID };
   return { result };
   ```
   Add the error ID constant to `src/consts.js`.

5. **Emit events to the caller instead of touching the DOM** from game logic. The `eventHandler` in `src/index.js` maps events to renderer calls.

6. **Update the renderer object** in `src/index.js` if a new UI state is needed:
   ```javascript
   const wordleRenderer = {
       // ...existing methods...
       renderNewState(data) { /* DOM updates here */ },
   };
   ```

7. **Update `src/index.js` event switch** to handle any new event type:
   ```javascript
   case "new-event": wordleRenderer.renderNewState(data); break;
   ```

8. **Add CSS to `index.css`** if new UI elements are required:
   - Use CSS custom properties (variables) for colours/theming
   - Use kebab-case class names
   - Use Flexbox for layout
   - Add responsive rules with `@media` if needed

9. **Export from the module** with the Node.js guard if the function is used in tests:
   ```javascript
   if (typeof process !== "undefined") {
       module.exports = { newFunction };
   }
   ```

10. **Write unit tests** in `test/<feature>_test.js` (see `/write-tests` skill).

11. **Write a Cypress E2E test** in `cypress/e2e/game/<feature>.cy.js` (see `/write-tests` skill).

## Checklist

- [ ] Logic is in the correct file (game vs render vs platform)
- [ ] No framework imports added
- [ ] Error IDs are constants in `consts.js`
- [ ] Events flow through `eventHandler`, not direct DOM calls from game logic
- [ ] CSS uses custom properties for any colours
- [ ] Unit tests written and passing (`pnpm test`)
- [ ] E2E test written and passing (`pnpm cypress:run`)
- [ ] Accessibility: `aria-label` added to any icon-only buttons
