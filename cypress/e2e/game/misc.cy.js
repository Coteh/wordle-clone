/// <reference types="cypress" />

const DAY_MS = 86400000;

const INPUT_DELAY_MS = 150;

describe("misc", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(DAY_MS * 2 + (DAY_MS * 1) / 2, ["Date"]);
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

        cy.wait(5000);
    });

    it("should be able to be played if feather icons could not load", () => {
        cy.intercept("https://unpkg.com/feather-icons", {
            statusCode: 500,
        });

        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.reload();
        cy.waitForGameReady();

        // Can still make inputs

        cy.get("body").type("a");
        cy.keyboardItem("b").click();

        cy.currentRow().inputCell(1).inputLetter().should("have.text", "a");
        cy.currentRow().inputCell(2).inputLetter().should("have.text", "b");

        // Substitute "icons" are placed on the page

        cy.get(".help-link").should("contain.text", "?");
        // NTS: cy.keyboardItem("backspace") won't work because it selects the feather element and feather isn't loaded
        cy.get(".keyboard > .keyboard-row:last-child > .keyboard-item:last-child").should(
            "contain.text",
            "←"
        );

        cy.get(".help-link").click();

        cy.get(".dialog button.close").should("contain.text", "X").click();

        // Can still play through the game

        cy.get("body").type("{enter}");

        cy.contains("Not enough letters").should("be.visible");

        cy.get("body").type("{backspace}");
        cy.get("body").type("{backspace}");

        cy.keyboardItem("t").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("h").click();
        cy.keyboardItem("enter").click();
        cy.contains("You win!").should("be.visible");
    });

    it("should not prevent an error dialog from being displayed if Sentry were to not be defined", () => {
        cy.intercept(
            {
                hostname: "js.sentry-cdn.com",
            },
            {
                statusCode: 500,
            }
        );
        cy.intercept("/words.txt", {
            statusCode: 500,
        });

        cy.clearBrowserCache();
        cy.reload();

        cy.contains("The following error occurred:").should("be.visible");
    });
});
