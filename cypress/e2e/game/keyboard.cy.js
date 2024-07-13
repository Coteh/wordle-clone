/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("keyboard", () => {
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
    });

    it("should be able to select from any of the available keyboard", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");
        
        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "PYFGCRL");

        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "ABCDEFGHIJK");

        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should set the Dvorak keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("not.contain.text", "PYFGCRL");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                "keyboard": "dvorak",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "PYFGCRL");
    });

    it("should set the alphabetical keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("not.contain.text", "ABCDEFGHIJK");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "alphabetical",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "ABCDEFGHIJK");
    });

    it("should set the QWERTY keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "qwerty",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should default to QWERTY keyboard if no entry exists in local storage for keyboard", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.removeItem("preferences");

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should default to QWERTY keyboard if keyboard is set to invalid value in local storage", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "invalid",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });
});
