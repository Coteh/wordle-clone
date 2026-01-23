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
        cy.get("body").should("have.css", "background-color", "rgb(0, 0, 0)");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "light");
        cy.get("body").should("have.css", "background-color", "rgb(255, 255, 255)");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "snow");
        cy.get("body").should("have.css", "background-color", "rgb(2, 0, 36)");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "");
        cy.get("body").should("have.css", "background-color", "rgb(0, 0, 0)");
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
        cy.get("body").should("have.css", "background-color", "rgb(255, 255, 255)");
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
        cy.get("body").should("have.css", "background-color", "rgb(2, 0, 36)");
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
        cy.get("body").should("have.css", "background-color", "rgb(0, 0, 0)");
    });

    it("should default to dark theme if no entry exists in local storage for theme", () => {
        cy.get("body").should("have.class", "");

        window.localStorage.removeItem("preferences");

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "");
        cy.get("body").should("have.css", "background-color", "rgb(0, 0, 0)");
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
        cy.get("body").should("have.css", "background-color", "rgb(0, 0, 0)");
    });

    it("should set the correct meta theme-color for dark theme", () => {
        cy.get("body").should("have.class", "");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#000000");
    });

    it("should set the correct meta theme-color for light theme", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "light");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");
    });

    it("should set the correct meta theme-color for snow theme", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "snow");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#020024");
    });

    it("should apply dimmed theme-color when a dialog is opened in dark theme", () => {
        cy.get("body").should("have.class", "");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#000000");

        cy.get(".help-link").click();

        // Dimmed dark: blend rgba(0,0,0,0.5) over rgb(0,0,0) = rgb(0,0,0) = #000000
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#000000");
    });

    it("should apply dimmed theme-color when a dialog is opened in light theme", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".settings .close").click();

        cy.get("body").should("have.class", "light");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");

        cy.get(".help-link").click();

        // Dimmed light: blend rgba(0,0,0,0.5) over rgb(255,255,255) = rgb(128,128,128) = #808080
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#808080");
    });

    it("should apply dimmed theme-color when a dialog is opened in snow theme", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".settings .close").click();

        cy.get("body").should("have.class", "snow");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#020024");

        cy.get(".help-link").click();

        // Dimmed snow: blend rgba(0,0,0,0.5) over rgb(2,0,36) = rgb(1,0,18) = #010012
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#010012");
    });

    it("should restore normal theme-color when dialog is closed", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".settings .close").click();

        cy.get("body").should("have.class", "light");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");

        cy.get(".help-link").click();
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#808080");

        cy.get(".dialog .close").click();
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");
    });

    it("should restore normal theme-color when dialog is closed via overlay click", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".settings .close").click();

        cy.get("body").should("have.class", "light");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");

        cy.get(".help-link").click();
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#808080");

        cy.get("body").click({ position: "left" });
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");
    });

    it("should restore normal theme-color when dialog is closed via escape key", () => {
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
        cy.get(".settings .close").click();

        cy.get("body").should("have.class", "light");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");

        cy.get(".help-link").click();
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#808080");

        cy.get("body").type("{esc}");
        cy.get("meta[name='theme-color']").should("have.attr", "content", "#ffffff");
    });
});
