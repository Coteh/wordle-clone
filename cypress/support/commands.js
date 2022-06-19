// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("keyboardItem", (key) => {
    if (key === "backspace") {
        return cy.get(".keyboard-item").get(".feather.feather-delete").parent().parent();
    }
    cy.get(".keyboard-item")
        .contains(new RegExp(`^${key.toUpperCase()}$`))
        .parent();
});

Cypress.Commands.add("inputRow", (num) => {
    cy.get(`.wordle-rows .input-row:nth-child(${num})`);
});

Cypress.Commands.add("currentRow", () => {
    cy.get("#current-input");
});

Cypress.Commands.add("inputCell", { prevSubject: true }, (subject, num) => {
    cy.get(`div:nth-child(${num})`, {
        withinSubject: subject,
    });
});

Cypress.Commands.add("inputLetter", { prevSubject: true }, (subject) => {
    cy.get(".box-letter", {
        withinSubject: subject,
    });
});

Cypress.Commands.add("inputRowHasWord", (row, word) => {
    assert.strictEqual(word.length, 5);
    for (let i = 1; i <= 5; i++) {
        cy.inputRow(row)
            .inputCell(i)
            .inputLetter()
            .should("have.text", word[i - 1]);
    }
});

Cypress.Commands.add("inputRowShouldBeEmpty", (row) => {
    for (let i = 1; i <= 5; i++) {
        cy.inputRow(row).inputCell(i).inputLetter().should("be.empty");
    }
});

// TODO: Find a better way to assert when game is ready
Cypress.Commands.add("waitForGameReady", () => {
    cy.get("#keyboard").should("be.visible");
});

Cypress.Commands.add("clearBrowserCache", () => {
    // Call Chrome's API for clearing browser cache when running this test,
    // certain requests such as username existence will not provide any data to Cypress when returned as a cached response
    // due to how cy.intercept manages the browser request
    // https://stackoverflow.com/a/67858001
    Cypress.automation("remote:debugger:protocol", {
        command: "Network.clearBrowserCache",
    });
});

// Adapted from https://github.com/cypress-io/cypress/discussions/21150#discussioncomment-2620947
Cypress.Commands.add("shouldNotBeActionable", { prevSubject: "element" }, (subject, done) => {
    cy.once("fail", (err) => {
        expect(err.message).to.include("`cy.click()` failed because this element");
        expect(err.message).to.include("is being covered by another element");
        done();
    });

    cy.wrap(subject)
        .click({
            timeout: 100,
        })
        .then(() => {
            done(new Error("Expected element NOT to be clickable, but click() succeeded"));
        });
});

// Adapted from https://github.com/cypress-io/cypress/issues/877#issuecomment-490504922
Cypress.Commands.add("shouldBeInViewport", { prevSubject: true }, (subject) => {
    const window = Cypress.$(cy.state("window"));
    const bottom = window.height();
    const right = window.width();
    const rect = subject[0].getBoundingClientRect();

    expect(rect.top).not.to.be.greaterThan(bottom);
    expect(rect.bottom).not.to.be.greaterThan(bottom);
    expect(rect.top).not.to.be.lessThan(0);
    expect(rect.bottom).not.to.be.lessThan(0);

    expect(rect.left).not.to.be.greaterThan(right);
    expect(rect.right).not.to.be.greaterThan(right);
    expect(rect.left).not.to.be.lessThan(0);
    expect(rect.right).not.to.be.lessThan(0);
});
