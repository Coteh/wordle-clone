/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("win dialog fadeIn animation", () => {
    beforeEach(() => {
        // Freeze ALL timers (including setTimeout) so we can control when the fadeIn timer fires.
        // This lets us close the dialog before the 10ms timer runs - which is the race condition
        // that causes "can't access property 'style', dialog is null" (render.js:221).
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.visit("/", {
            onBeforeLoad: (win) => {
                win.localStorage.setItem("wc_played_before", "true");
            },
        });
        cy.waitForGameReady();
        // Win the game (word for this day is "leafy")
        cy.keyboardItem("l").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("f").click();
        cy.keyboardItem("y").click();
        cy.keyboardItem("enter").click();
    });

    it("should display win dialog after player wins", () => {
        // Tick to fire the frozen fadeIn timer - dialog transitions from opacity:0 to visible
        cy.tick(10);
        cy.contains("You win!").should("be.visible");
    });

    it("should not throw when the dialog is removed before the fadeIn timer fires", () => {
        // The win dialog is shown with opacity:0 (timer is frozen, so it stays invisible).
        // Clicking the overlay while the dialog is invisible is what triggers the bug in prod -
        // the player sees nothing and clicks through, closing the dialog. When the frozen 10ms
        // timer eventually fires, document.querySelector(".dialog") returns null and throws.
        cy.get(".dialog").should("exist");

        // Close the dialog before the timer fires (simulates overlay click on the invisible dialog)
        cy.get(".overlay-back").click();

        cy.get(".dialog").should("not.exist");

        // Fire the frozen fadeIn timer - this is where the crash occurs with the buggy code:
        // "Uncaught TypeError: can't access property 'style', dialog is null" (render.js:221)
        // Cypress automatically fails the test if an uncaught exception is thrown.
        cy.tick(10);
    });
});

describe("dialogs", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("wc_played_before", true);
            },
        });
        cy.waitForGameReady();

        // The How to Play dialog is an example of a closable dialog that can be triggered in normal usage
        cy.get(".help-link").click();
    });

    describe("general dialog behaviour", () => {
        it("should be visible", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");
        });

        [
            {
                name: "backspace",
                input: "backspace",
            },
            {
                name: "f key",
                input: "f",
            },
            {
                name: "enter key",
                input: "enter",
            },
        ].forEach((def) => {
            it(`prevents inputs from being made on touch keyboard - case '${def.name}'`, (done) => {
                cy.keyboardItem(def.input).shouldNotBeActionable(done);
            });
        });

        it("prevents player from making any more inputs with physical keyboard", () => {
            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.get("body").type("{backspace}");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.get("body").type("f");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.inputRow(1).should("have.id", "current-input");
            cy.inputRow(2).should("not.have.id", "current-input");

            cy.get("body").type("{enter}");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.inputRow(1).should("have.id", "current-input");
            cy.inputRow(2).should("not.have.id", "current-input");
        });

        // NTS: If dialog does not appear on the screen for some reason, which should never happen anyway under normal operation, then player can make physical key inputs.
        // At this time, I'm not going to handle this case since behaviour would already be undefined at that point; thus, handling this particular case may be a bit too much.
    });

    describe("closable dialogs", () => {
        it("can be closed by clicking on the X button", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get(".dialog > .close").click();

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("can be closed by clicking elsewhere besides the dialog", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get("body").click({
                position: "left",
            });

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("allows inputs to be made again after closing", () => {
            cy.get("body").type("b");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.get(".dialog > .close").click();

            cy.get("body").type("b");

            cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "b");
            for (let i = 2; i <= 5; i++) {
                cy.inputRow(1).inputCell(i).inputLetter().should("be.empty");
            }
            for (let i = 2; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }
        });

        it("should not be able to be closed by pressing enter key", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get(".dialog .close").blur();

            cy.get("body").type("{enter}");

            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");
        });

        it("can be closed by pressing escape key", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get("body").type("{esc}");

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("functions without an OK button", () => {
            // The How to Play dialog does not have an OK button
            cy.get(".dialog").should("be.visible");
            cy.get(".dialog .ok").should("not.exist");

            // Dialog can still be closed via X button
            cy.get(".dialog > .close").click();

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });
    });

    describe("closable dialogs with OK button", () => {
        beforeEach(() => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", true);
                },
            });
            cy.waitForGameReady();
            cy.get(".debug-link#debug").click();
            cy.contains("Migration Dialog").click();
        });

        it("can be closed by clicking the OK button", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get(".dialog .ok").should("be.visible").click();

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("can still be closed by clicking the X button", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get(".dialog > .close").click();

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("can still be closed by clicking outside the dialog", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get("body").click({
                position: "left",
            });

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });

        it("can still be closed by pressing escape key", () => {
            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            cy.get("body").type("{esc}");

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });
    });

    describe("non-closable dialogs", () => {
        beforeEach(() => {
            // The error dialog is an example of a non-closable dialog that can be triggered in normal usage
            cy.intercept("GET", "/words.txt", {
                statusCode: 404,
                body: "Not found",
            });
            cy.clearBrowserCache();
            cy.reload();
        });

        it("hides X button and cannot be clicked", () => {
            cy.get(".dialog").should("be.visible");

            cy.get(".dialog > .close").should("not.be.visible").click({
                force: true,
            });

            cy.get(".dialog").should("be.visible");
        });

        it("can not be closed by clicking elsewhere besides the dialog", () => {
            cy.get(".dialog").should("be.visible");

            cy.get("body").click({
                position: "left",
            });

            cy.get(".dialog").should("be.visible");
        });
    });
});
