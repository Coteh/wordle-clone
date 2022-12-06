/// <reference types="cypress" />

const DAY_MS = 86400000;
const FIRST_DAY_MS = 1647993600000;

const MOBILE_DEVICE_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";

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

    describe("landscape overlay", function () {
        it("should show the overlay when screen is rotated in landscape mode", function () {
            // set the user agent for the current test
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                },
            });

            // Set the screen orientation to landscape
            cy.viewport("iphone-6", "landscape");

            // Check that the overlay is visible
            cy.get("#landscape-overlay").should("be.visible").and("have.css", "display", "block");

            // Set the screen orientation back to portrait
            cy.viewport("iphone-6", "portrait");

            // Check that the overlay is hidden
            cy.get("#landscape-overlay")
                .should("not.be.visible")
                .and("have.css", "display", "none");
        });

        it("displays the rotate device overlay when in landscape mode and loading the page", function () {
            cy.viewport(1024, 768); // set the viewport to 1024x768
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                },
            }); // visit the page
            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("be.visible"); // assert that the overlay is visible
            cy.viewport(768, 1024); // set the viewport to 768x1024
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                },
            }); // visit the page again
            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("not.be.visible"); // assert that the overlay is not visible
        });
    });

    describe("cache-less tests", () => {
        // https://github.com/cypress-io/cypress/issues/14459#issuecomment-765630421
        before(() => {
            Cypress.automation("remote:debugger:protocol", {
                command: "Network.setCacheDisabled",
                params: { cacheDisabled: true },
            });
        });

        // This test has issues with interception of the feather-icons dependency, it occasionally gets cached.
        // Turning off caching for this test.
        it("should be able to be played if feather icons could not load", () => {
            cy.intercept("https://unpkg.com/**/feather.min.js", {
                statusCode: 500,
            }).as("feather");

            cy.intercept("/words.txt", {
                fixture: "words.txt",
            });
            cy.reload();
            cy.waitForGameReady();

            cy.wait("@feather");

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

            // Can still see Settings button and the close button inside it

            cy.contains("Settings").should("not.be.visible");

            cy.get(".settings-link").should("contain.text", "⚙").click();

            cy.contains("Settings").should("be.visible");

            cy.get(".settings button.close").should("contain.text", "X").click();

            // Can still play through the game

            cy.get("body").type("{enter}");

            cy.contains("Not enough letters").should("be.visible");

            cy.get("body").type("{backspace}");
            cy.get(".keyboard > .keyboard-row:last-child > .keyboard-item:last-child").click();

            cy.keyboardItem("t").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("c").click();
            cy.keyboardItem("h").click();
            cy.keyboardItem("enter").click();
            cy.contains("You win!").should("be.visible");
        });

        after(() => {
            Cypress.automation("remote:debugger:protocol", {
                command: "Network.setCacheDisabled",
                params: { cacheDisabled: false },
            });
        });
    });
});
