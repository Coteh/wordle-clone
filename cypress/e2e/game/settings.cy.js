/// <reference types="cypress" />

import { version } from "../../../package.json";

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("settings", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 20 + (DAY_MS * 1) / 2, ["Date"]);
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

    it("should appear in place of the game pane when selected from top nav", () => {
        cy.get(".keyboard").should("be.visible");
        cy.contains("Settings").should("not.be.visible");

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("not.be.visible");
        cy.contains("Settings").should("be.visible");
    });

    it("should disappear and show game pane again when settings button is clicked when in settings pane", () => {
        cy.get(".settings-link").click();

        cy.get(".keyboard").should("not.be.visible");
        cy.contains("Settings").should("be.visible");

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("be.visible");
        cy.contains("Settings").should("not.be.visible");
    });

    it("should disappear and show game pane again when close button is clicked in settings pane", () => {
        cy.get(".settings-link").click();

        cy.get(".keyboard").should("not.be.visible");
        cy.contains("Settings").should("be.visible");

        cy.get(".close").click();

        cy.get(".keyboard").should("be.visible");
        cy.contains("Settings").should("not.be.visible");
    });

    it("should enable a setting when clicked", () => {
        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");

        cy.get(".settings-item.high-contrast").should("contain.text", "OFF");
        cy.window().then((win) => {
            expect(win.localStorage.getItem("preferences")).to.be.null;
        });

        cy.get(".settings-item.high-contrast").click();

        cy.get(".settings-item.high-contrast").should("contain.text", "ON");
        cy.window().then((win) => {
            expect(win.localStorage.getItem("preferences")).to.be.eql(
                JSON.stringify({
                    ["high-contrast"]: "enabled",
                })
            );
        });
    });

    it("should reenable a setting if it's set to enabled in local storage and page is reloaded", () => {
        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["high-contrast"]: "enabled",
            })
        );

        cy.reload();

        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");

        cy.get(".settings-item.high-contrast").should("contain.text", "ON");
    });

    it("should show version number at the bottom of the settings pane", () => {
        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");
        cy.contains(`v${version}`).should("be.visible");
    });

    it("should show copyright at the bottom of the settings pane", () => {
        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");
        cy.contains(/© .* James Cote/i).should("be.visible");
    });

    it("should show credits for snow effect at the bottom of the settings pane if snow theme is enabled", () => {
        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");
        cy.contains("embed.im").should("not.be.visible");

        cy.get(".setting.theme-switch").click();
        cy.get(".setting.theme-switch").click();

        cy.get("body").should("have.class", "snow");
        cy.contains("embed.im").should("be.visible");

        cy.get(".setting.theme-switch").click();

        cy.get("body").should("not.have.class", "snow");
        cy.contains("embed.im").should("not.be.visible");
    });

    it("should show day number at the bottom of the settings pane", () => {
        cy.get(".settings-link").click();

        cy.contains("Settings").should("be.visible");
        cy.contains("Day #20").should("be.visible");
    });

    it("should handle preferences value in local storage being in invalid state", () => {
        window.localStorage.setItem("preferences", "invalid");

        cy.reload();
        cy.waitForGameReady();

        cy.window().then((win) => {
            expect(win.localStorage.getItem("preferences")).to.be.eql("{}");
        });
    });
});
