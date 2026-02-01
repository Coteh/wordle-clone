/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("how to play", { browser: 'chrome' }, () => {
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
                window.localStorage.setItem("played_before", false);
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
});
