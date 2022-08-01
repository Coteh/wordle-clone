/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("loading word of the day", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1, ["Date"]);
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
    });
    it("should handle word list from server", () => {
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.reload();
        cy.keyboardItem("l").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("f").click();
        cy.keyboardItem("y").click();
        cy.keyboardItem("enter").click();
        cy.contains("You win!").should("be.visible");
    });
    it("should handle gracefully if word list cannot be handled", () => {
        cy.intercept("GET", "/words.txt", {
            statusCode: 404,
            body: "Not found",
        });
        cy.clearBrowserCache();
        cy.reload();
        cy.contains("Could not fetch word list.").should("be.visible");
        // The error dialog should not close
        cy.get(".overlay-back").click("left");
        cy.contains("Could not fetch word list.").should("be.visible");
    });
});
