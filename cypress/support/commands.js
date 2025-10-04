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
    // Call Chrome's API for clearing browser cache when running this test
    // https://stackoverflow.com/a/67858001
    Cypress.automation("remote:debugger:protocol", {
        command: "Network.clearBrowserCache",
    });
});

Cypress.Commands.add("clearServiceWorkers", () => {
    cy.window().then((win) => {
        if ('serviceWorker' in win.navigator) {
            win.navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => registration.unregister());
            });
        }
    });
});

Cypress.Commands.add("clearServiceWorkerCaches", () => {
    cy.window().then((win) => {
        if ('caches' in win) {
            win.caches.keys().then((keys) => {
                keys.forEach((key) => win.caches.delete(key));
            });
        }
    });
});

// https://www.cypress.io/blog/testing-application-in-offline-network-mode
Cypress.Commands.add("goOffline", () => {
    cy.log("**go offline**")
        .then(() => {
            return Cypress.automation('remote:debugger:protocol', {
                command: 'Network.enable',
            })
        })
        .then(() => {
            return Cypress.automation('remote:debugger:protocol', {
                command: 'Network.emulateNetworkConditions',
                params: {
                    offline: true,
                    latency: -1,
                    downloadThroughput: -1,
                    uploadThroughput: -1,
                },
            })
        });
});

Cypress.Commands.add("goOnline", () => {
    cy.log("**go online**")
        .then(() => {
            return Cypress.automation('remote:debugger:protocol', {
                command: 'Network.emulateNetworkConditions',
                params: {
                    offline: false,
                    latency: -1,
                    downloadThroughput: -1,
                    uploadThroughput: -1,
                },
            })
        })
        .then(() => {
            return Cypress.automation('remote:debugger:protocol', {
                command: 'Network.disable',
            })
        });
});

// Needed in order to make share tests work in headless
// https://github.com/cypress-io/cypress/issues/8957
Cypress.Commands.add("grantClipboardPermission", () => {
    cy.wrap(
        Cypress.automation('remote:debugger:protocol', {
            command: 'Browser.grantPermissions',
            params: {
                permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
                origin: window.location.origin,
            },
        }).catch((error) =>
            // Electron (v106 and newer) will land here, but that's ok, cause the permissions will be granted anyway
            // https://github.com/cypress-io/cypress/issues/18675#issuecomment-1403483477
            // https://gist.github.com/mbinic/e75a8910ec51a27a041f967e5b3a5345
            Cypress.log({ message: `Permission request failed: ${error.message}` })
        )
    );
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

    expect(rect.top).not.to.be.greaterThan(bottom).and.not.to.be.lessThan(0);
    expect(rect.bottom).not.to.be.greaterThan(bottom).and.not.to.be.lessThan(0);
    expect(rect.left).not.to.be.greaterThan(right).and.not.to.be.lessThan(0);
    expect(rect.right).not.to.be.greaterThan(right).and.not.to.be.lessThan(0);
});

Cypress.Commands.add("waitUntilDialogAppears", () => {
    cy.waitUntil(() =>
        cy.window().then((win) => {
            cy.get(".dialog").then(
                (dialog) => parseInt(win.getComputedStyle(dialog[0]).top) <= win.innerHeight / 2
            );
        })
    );
});

// Extended cy.intercept to add a log when the request gets intercepted.
// See https://glebbahmutov.com/blog/cypress-intercept-problems/
Cypress.Commands.overwrite("intercept", (intercept, ...args) =>
    cy.log("intercept", args).then(() => intercept(...args))
);
