/// <reference types="cypress" />

const DAY_MS = 86400000;
const FIRST_DAY_MS = 1647993600000;

const INPUT_DELAY_MS = 100;

describe("misc", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 2 + (DAY_MS * 1) / 2, ["Date"]);
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
            },
        });
    });

    it("gameplay screenshot", () => {
        cy.viewport("iphone-x");

        cy.intercept("/words.txt", {
            fixture: "readme-screenshot-words.txt",
        });
        cy.clearBrowserCache();
        cy.reload();
        cy.waitForGameReady();

        cy.wait(1000);

        // Touch inputs moves the viewport up a bit on Cypress, physical typing does not, so going to use physical typing for this footage.
        ["grain", "rebel", "reels"].forEach((word) => {
            word.split("").forEach((letter, i) => {
                cy.get("body").type(letter);
                // Make the second letter input of each row take thrice as long, Cypress video export seems to show first and second letters of first row inputted at the same time for some reason.
                cy.wait(i == 0 ? INPUT_DELAY_MS * 3 : INPUT_DELAY_MS);
            });
            cy.get("body").type("{enter}");
            cy.wait(INPUT_DELAY_MS);
        });

        cy.contains("You win!").should("be.visible");

        for (let i = 0; i < 3; i++) {
            cy.tick(1000);
            cy.wait(1000);
        }

        cy.get(".close").click();

        cy.wait(3000);
    });
});
