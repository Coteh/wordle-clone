/// <reference types="cypress" />

const DAY_MS = 86400000;
const FIRST_DAY_MS = 1647993600000;

const MOBILE_DEVICE_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";
const DESKTOP_USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0";

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

    describe("notification", () => {
        it("should display notification(s) if things happen", () => {
            cy.contains("Input not provided").should("not.exist");
            cy.contains("Not enough letters").should("not.exist");

            cy.keyboardItem("enter").click();

            cy.contains("Input not provided").should("be.visible");
            cy.contains("Not enough letters").should("not.exist");

            cy.get("body").type("a");
            cy.keyboardItem("enter").click();

            cy.contains("Not enough letters").should("be.visible");

            cy.waitUntil(() =>
                cy.document().then((doc) => doc.querySelector(".notification") == null)
            );

            cy.contains("Input not provided").should("not.exist");
            cy.contains("Not enough letters").should("not.exist");
        });
    });

    describe("landscape overlay", function () {
        it("should show the overlay when screen is rotated in landscape mode", function () {
            // Set the screen orientation to portrait
            cy.viewport("iphone-6", "portrait");

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

        it("should not display the rotate device overlay when in desktop mode", function () {
            cy.viewport(768, 1024); // set the viewport to 768x1024

            // Check that the overlay is hidden
            cy.get("#landscape-overlay")
                .should("not.be.visible")
                .and("have.css", "display", "none");

            cy.viewport(1024, 768); // set the viewport to 1024x768

            // Check that the overlay is hidden
            cy.get("#landscape-overlay")
                .should("not.be.visible")
                .and("have.css", "display", "none");

            cy.viewport(768, 1024); // set the viewport to 768x1024

            // Check that the overlay is hidden
            cy.get("#landscape-overlay")
                .should("not.be.visible")
                .and("have.css", "display", "none");
        });

        it("should not show any game element", () => {
            cy.viewport(1024, 768); // set the viewport to 1024x768
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                    window.localStorage.setItem("played_before", false);
                },
            }); // visit the page
            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("be.visible"); // assert that the overlay is visible
            cy.waitForGameReady();

            cy.waitUntilDialogAppears();

            cy.contains("How to play").should("not.be.visible");
        });

        it("should show the snowflakes when activated while snow theme enabled", () => {
            // Set the screen orientation to landscape
            cy.viewport("iphone-6", "landscape");

            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            theme: "snow",
                        })
                    );
                },
            });

            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("be.visible"); // assert that the overlay is visible

            cy.waitForGameReady();
            // Cypress checks if element is interactive when doing visibility check
            // This is a workaround to have Cypress see that it's visible.
            cy.get("#embedim--snow").invoke("css", "pointer-events", "auto");
            cy.get("#embedim--snow").should("be.visible");

            // Set the screen orientation back to portrait
            cy.viewport("iphone-6", "portrait");

            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("not.be.visible"); // assert that the overlay is not visible

            cy.waitForGameReady();

            cy.get("#embedim--snow").should("be.visible");
        });

        it("should not show snowflakes if snow theme is not enabled", () => {
            // Set the screen orientation to landscape
            cy.viewport("iphone-6", "landscape");

            cy.visit("/", {
                onBeforeLoad: (win) => {
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: MOBILE_DEVICE_USER_AGENT,
                    });
                },
            });

            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("be.visible"); // assert that the overlay is visible

            cy.waitForGameReady();
            // Cypress checks if element is interactive when doing visibility check
            // This is a workaround to have Cypress see that it's visible.
            cy.get("#embedim--snow").invoke("css", "pointer-events", "auto");
            cy.get("#embedim--snow").should("not.be.visible");

            // Set the screen orientation back to portrait
            cy.viewport("iphone-6", "portrait");

            cy.get("#landscape-overlay") // get the rotate device overlay element
                .should("not.be.visible"); // assert that the overlay is not visible

            cy.waitForGameReady();

            cy.get("#embedim--snow").should("not.be.visible");
        });
    });

    describe("noscript", () => {
        // It's unreasonably difficult in Cypress atm to disable JS for one test, shouldn't have to manipulate the parent iframe just to do it.
        // Putting the open issue URL here in case I want to revisit it: https://github.com/cypress-io/cypress/issues/1611
        // Instead, I'll test for the inverse for now since this isn't critical.
        it("should not display a message telling player to enable JS if it's enabled", () => {
            cy.contains("Please enable JavaScript to play this game.").should("not.be.visible");
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
            cy.intercept("/vendor/feather.min.js", {
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
