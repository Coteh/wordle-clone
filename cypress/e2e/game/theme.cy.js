/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("theme", () => {
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

    it("should be able to select from any of the available themes", () => {
        cy.get(".settings-link").click();

        cy.get("body").should("have.class", "");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "light");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "snow");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "");
    });

    it("should set the light theme on page reload if it's enabled in local storage", () => {
        cy.get("body").should("not.have.class", "light");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                theme: "light",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "light");
    });

    it("should set the snow theme on page reload if it's enabled in local storage", () => {
        cy.get("body").should("not.have.class", "snow");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                theme: "snow",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "snow");
    });

    it("should set the dark theme on page reload if it's enabled in local storage", () => {
        cy.get("body").should("have.class", "");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                theme: "dark",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "");
    });

    it("should default to dark theme if no entry exists in local storage for theme", () => {
        cy.get("body").should("have.class", "");

        window.localStorage.removeItem("preferences");

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "");
    });

    it("should default to dark theme if theme is set to invalid value in local storage", () => {
        cy.get("body").should("have.class", "");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                theme: "invalid",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "");
    });
});
