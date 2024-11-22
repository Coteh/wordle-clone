/// <reference types="cypress" />

import { LocalStorageNotAvailableError } from "../../../src/error";

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;
const FIRST_DAY = 19074;

describe("handling local storage disabled", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.disableLocalStorage({
            withError: new LocalStorageNotAvailableError(),
        });
        cy.visit("/");
        cy.waitForGameReady();
    });

    it("should still allow player to play the game", () => {
        cy.keyboardItem("a").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("h").click();
        cy.keyboardItem("a").click();

        cy.keyboardItem("enter").click();

        cy.keyboardItem("l").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("f").click();
        cy.keyboardItem("y").click();

        cy.keyboardItem("enter").click();

        cy.get(".dialog").should("be.visible").shouldBeInViewport();

        cy.contains("You win!").should("be.visible").shouldBeInViewport();
        cy.contains("Next Wordle").should("be.visible").shouldBeInViewport();

        // TODO: Add some commands to reload and then lose a game as well
    });

    it("should still allow player to change game settings", () => {
        cy.get(".settings-link").click();

        cy.get("body").should("have.class", "");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "light");
    });
    
    it("should display a dialog notifying player about disabled local storage", () => {
        cy.get(".dialog").should("be.visible").shouldBeInViewport();

        cy.contains("local storage").should("be.visible").shouldBeInViewport();
    });
});
