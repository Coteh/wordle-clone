/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("dialogs", { browser: 'chrome' }, () => {
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
                window.localStorage.setItem("played_before", true);
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
