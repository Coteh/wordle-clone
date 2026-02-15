/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("how to play", () => {
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
                window.localStorage.setItem("wc_played_before", false);
            },
        });
        cy.waitForGameReady();
    });

    it("should appear when player first starts the game", () => {
        cy.contains("How to play").should("be.visible");
    });

    it("should not appear again after the first time game is loaded", () => {
        cy.reload();
        cy.waitForGameReady();
        cy.contains("How to play").should("not.exist");
    });

    it("can be brought up at any time by clicking on the help icon", () => {
        cy.reload();
        cy.waitForGameReady();
        cy.contains("How to play").should("not.exist");
        cy.get(".help-link").click();
        cy.contains("How to play").should("be.visible");
    });

    it("can be closed by pressing enter key after clicking help icon", () => {
        cy.reload();
        cy.waitForGameReady();

        cy.contains("How to play").should("not.exist");
        cy.get(".help-link").click();
        cy.contains("How to play").should("be.visible");

        cy.get(".dialog").should("be.visible");
        cy.get(".overlay-back").should("be.visible");

        // Need to use cypress-real-events realType method to simulate a "real" enter key press to trigger the exact scenario
        // that happens in real browser where the browser is still focused on the help link at this point and triggers the help dialog again.
        cy.get(".help-link").realType("{enter}");

        cy.get(".dialog").should("not.exist");
        cy.get(".overlay-back").should("not.be.visible");
    });

    it("should not reopen when pressing enter after closing dialog (COT-63)", () => {
        cy.reload();
        cy.waitForGameReady();

        // Open the how to play dialog
        cy.get(".help-link").click();
        cy.contains("How to play").should("be.visible");

        // Close the dialog by clicking the X button
        cy.get(".dialog > .close").click();
        cy.get(".dialog").should("not.exist");

        // Type some letters and press enter to submit a word
        cy.get("body").type("hello{enter}");

        // The dialog should not reopen
        cy.get(".dialog").should("not.exist");
        cy.contains("How to play").should("not.exist");

        // The word should be submitted (first row should have input)
        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "h");
        cy.inputRow(1).inputCell(2).inputLetter().should("have.text", "e");
        cy.inputRow(1).inputCell(3).inputLetter().should("have.text", "l");
        cy.inputRow(1).inputCell(4).inputLetter().should("have.text", "l");
        cy.inputRow(1).inputCell(5).inputLetter().should("have.text", "o");
    });
});
