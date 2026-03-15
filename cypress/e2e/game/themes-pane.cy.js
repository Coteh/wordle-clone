/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("themes pane", () => {
    beforeEach(() => {
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
        cy.get(".settings-link").click();
        cy.get(".setting.theme-switch").click();
    });

    it("should appear in place of the settings pane when the theme setting is clicked", () => {
        cy.contains("Settings").should("not.be.visible");
        cy.contains("Themes").should("be.visible");
        cy.get(".keyboard").should("not.be.visible");
    });

    it("should show a card for each selectable theme", () => {
        cy.get(".theme-card.dark").should("be.visible");
        cy.get(".theme-card.light").should("be.visible");
        cy.get(".theme-card.snow").should("be.visible");
    });

    it("should mark the currently active theme card", () => {
        cy.get(".theme-card.dark").should("have.class", "active");
        cy.get(".theme-card.light").should("not.have.class", "active");
        cy.get(".theme-card.snow").should("not.have.class", "active");
    });

    it("should switch theme and update active card when a card is clicked", () => {
        cy.get(".theme-card.light").click();
        cy.get("body").should("have.class", "light");
        cy.get(".theme-card.light").should("have.class", "active");
        cy.get(".theme-card.dark").should("not.have.class", "active");
    });

    it("should update the settings theme toggle label when a card is selected", () => {
        cy.get(".theme-card.light").click();
        cy.get(".themes .back").click();
        cy.get(".setting.theme-switch .toggle").should("have.text", "light");
    });

    it("should return to settings pane when the back button is clicked", () => {
        cy.contains("Themes").should("be.visible");
        cy.get(".themes .back").click();
        cy.contains("Settings").should("be.visible");
        cy.contains("Themes").should("not.be.visible");
        cy.get(".keyboard").should("not.be.visible");
    });

    it("should return to the game when the close button is clicked", () => {
        cy.contains("Themes").should("be.visible");
        cy.get(".themes .close").click();
        cy.get(".keyboard").should("be.visible");
        cy.contains("Themes").should("not.be.visible");
    });

    it("should have a scrollable theme cards container", () => {
        cy.get(".theme-cards")
            .should("have.css", "overflow-y")
            .and("match", /auto|scroll/);
    });

    it("should have theme cards container constrained to pane height to allow scrolling", () => {
        cy.get(".theme-cards").then(($el) => {
            const el = $el[0];
            expect(el.scrollHeight).to.be.at.least(el.clientHeight);
        });
    });
});
