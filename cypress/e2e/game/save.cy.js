/// <reference types="cypress" />

import { version } from "../../../package.json";

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;
const FIRST_DAY = 19074;

describe("retrieving saved progress", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.clearServiceWorkerCaches();
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
                window.localStorage.setItem("last_version", version);
                window.localStorage.setItem("day", FIRST_DAY + 1);
                window.localStorage.setItem("lives", 4);
                window.localStorage.setItem("ended", false);
                window.localStorage.setItem(
                    "attempts",
                    JSON.stringify([
                        [
                            {
                                letter: "a",
                                correct: false,
                                within: true,
                            },
                            {
                                letter: "l",
                                correct: false,
                                within: true,
                            },
                            {
                                letter: "p",
                                correct: false,
                                within: false,
                            },
                            {
                                letter: "h",
                                correct: false,
                                within: false,
                            },
                            {
                                letter: "a",
                                correct: false,
                                within: false,
                            },
                        ],
                        [
                            {
                                letter: "m",
                                correct: false,
                                within: false,
                            },
                            {
                                letter: "a",
                                correct: true,
                                within: false,
                            },
                            {
                                letter: "y",
                                correct: false,
                                within: true,
                            },
                            {
                                letter: "o",
                                correct: false,
                                within: false,
                            },
                            {
                                letter: "r",
                                correct: false,
                                within: false,
                            },
                        ],
                    ])
                );
            },
        });
        cy.waitForGameReady();
    });

    it("should use progress from local storage if the game is loaded on the same day as the progress was saved", () => {
        cy.inputRowHasWord(1, "alpha");
        cy.inputRowHasWord(2, "mayor");

        cy.inputRow(1).inputCell(1).should("have.class", "within");
        cy.inputRow(1).inputCell(2).should("have.class", "within");
        cy.inputRow(1).inputCell(3).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(4).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(5).should("have.class", "incorrect");

        cy.inputRow(2).inputCell(1).should("have.class", "incorrect");
        cy.inputRow(2).inputCell(2).should("have.class", "correct");
        cy.inputRow(2).inputCell(3).should("have.class", "within");
        cy.inputRow(2).inputCell(4).should("have.class", "incorrect");
        cy.inputRow(2).inputCell(5).should("have.class", "incorrect");

        // Verify that player has 4 lives remaining
        for (let i = 0; i < 4; i++) {
            cy.get("body").type("s");
            cy.get("body").type("p");
            cy.get("body").type("i");
            cy.get("body").type("c");
            cy.get("body").type("e");
            cy.keyboardItem("enter").click();
        }

        cy.contains("You lose!").should("be.visible");
        cy.contains("word was leafy").should("be.visible");
    });

    it("should clear old progress if currently saved progress was made on a different day", () => {
        window.localStorage.setItem("day", FIRST_DAY + 0);

        cy.reload();
        cy.waitForGameReady();

        for (let i = 1; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        // Verify that player has all 6 of their lives
        for (let i = 0; i < 6; i++) {
            cy.get("body").type("s");
            cy.get("body").type("p");
            cy.get("body").type("i");
            cy.get("body").type("c");
            cy.get("body").type("e");
            cy.keyboardItem("enter").click();
        }

        cy.contains("You lose!").should("be.visible");
        cy.contains("word was leafy").should("be.visible");
    });

    it("should handle recovering a win state", () => {
        window.localStorage.setItem("lives", 3);
        window.localStorage.setItem("ended", true);
        window.localStorage.setItem(
            "attempts",
            JSON.stringify([
                [
                    {
                        letter: "a",
                        correct: false,
                        within: true,
                    },
                    {
                        letter: "l",
                        correct: false,
                        within: true,
                    },
                    {
                        letter: "p",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "h",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "a",
                        correct: false,
                        within: false,
                    },
                ],
                [
                    {
                        letter: "m",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "a",
                        correct: true,
                        within: false,
                    },
                    {
                        letter: "y",
                        correct: false,
                        within: true,
                    },
                    {
                        letter: "o",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "r",
                        correct: false,
                        within: false,
                    },
                ],
                [
                    {
                        letter: "l",
                        correct: true,
                        within: false,
                    },
                    {
                        letter: "e",
                        correct: true,
                        within: false,
                    },
                    {
                        letter: "a",
                        correct: true,
                        within: false,
                    },
                    {
                        letter: "f",
                        correct: true,
                        within: false,
                    },
                    {
                        letter: "y",
                        correct: true,
                        within: false,
                    },
                ],
            ])
        );

        cy.reload();
        cy.waitForGameReady();

        cy.contains("You win!").should("be.visible");
    });

    it("should handle recovering a lose state", () => {
        window.localStorage.setItem("lives", 0);
        window.localStorage.setItem("ended", true);
        window.localStorage.setItem(
            "attempts",
            JSON.stringify(
                new Array(6).fill([
                    {
                        letter: "a",
                        correct: false,
                        within: true,
                    },
                    {
                        letter: "l",
                        correct: false,
                        within: true,
                    },
                    {
                        letter: "p",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "h",
                        correct: false,
                        within: false,
                    },
                    {
                        letter: "a",
                        correct: false,
                        within: false,
                    },
                ])
            )
        );

        cy.reload();
        cy.waitForGameReady();

        cy.contains("You lose!").should("be.visible");
    });

    // Test for one day ahead, and two days ahead
    [{
        dayDiff: 1,
        expectedWord: "teach",
    }, {
        dayDiff: 2,
        expectedWord: "wrath",
    }].forEach(({ dayDiff, expectedWord }) => {
        it(`should clear saved progress on reload if game was completed on a different day than when it was received - ${dayDiff} days ahead`, () => {
            // Reset the clock
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);

            // Reload the page
            cy.reload();
            cy.waitForGameReady();

            // Move forward dayDiff day
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(FIRST_DAY_MS + DAY_MS * (1 + dayDiff) + (DAY_MS * 1) / 2, ["Date"]);

            // Lose
            for (let i = 1; i <= 4; i++) {
                cy.keyboardItem("s").click();
                cy.keyboardItem("p").click();
                cy.keyboardItem("i").click();
                cy.keyboardItem("c").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();
            }

            cy.contains("You lose!").should("be.visible");
            cy.contains("word was leafy").should("be.visible");

            // Reload the page, should be reset
            cy.reload();
            cy.waitForGameReady();

            for (let i = 1; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.contains("You lose!").should("not.exist");
            cy.contains(`word was ${expectedWord}`).should("not.exist");

            // Next day's word should be available
            for (let i = 1; i <= 6; i++) {
                cy.keyboardItem("s").click();
                cy.keyboardItem("p").click();
                cy.keyboardItem("i").click();
                cy.keyboardItem("c").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();
            }

            cy.contains("You lose!").should("be.visible");
            cy.contains(`word was ${expectedWord}`).should("be.visible");
        });
    });

    // TODO implement a more sophisticated method for checking validity of a game state
    // if the state is invalid, depending on what type of state corruption it is, give an error instead of reinitializing state
    // so that the players don't potentially lose their stats
    it.skip("should handle invalid state", () => {
        window.localStorage.setItem("lives", 3);
        window.localStorage.setItem("ended", true);
        window.localStorage.setItem("attempts", JSON.stringify([[]]));

        cy.reload();
        cy.waitForGameReady();

        for (let i = 1; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        // Verify that player has all 6 of their lives
        for (let i = 0; i < 6; i++) {
            cy.get("body").type("s");
            cy.get("body").type("p");
            cy.get("body").type("i");
            cy.get("body").type("c");
            cy.get("body").type("e");
            cy.keyboardItem("enter").click();
        }

        cy.contains("You lose!").should("be.visible");
        cy.contains("word was leafy").should("be.visible");
    });

    // TODO: These tests need service worker enabled in order to serve cached page with an updated sw.js to trigger the update prompt
    describe.skip("saved progress with an update prompt", () => {
        describe("won game", () => {
            it('should display win dialog first, then display the update prompt once closed', () => {
                // Spy on changelog to ensure that changelog is fetched successfully
                cy.intercept("GET", "/CHANGELOG.html").as("getChangelog");

                // Reload page but preload localStorage so both an ended game and an old last_version exist
                cy.visit("/", {
                    onBeforeLoad: (win) => {
                        // mark played before so version prompt is eligible
                        win.localStorage.setItem("played_before", true);
                        // set to an old version to trigger update prompt
                        win.localStorage.setItem("last_version", "1.0.0");
                        // preload a completed (win) game so end-game dialog would be emitted on load
                        win.localStorage.setItem("ended", true);
                        win.localStorage.setItem("lives", 3);
                        // a final winning attempt
                        win.localStorage.setItem(
                            "attempts",
                            JSON.stringify([
                                [
                                    {
                                        letter: "a",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "l",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "p",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "h",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: false,
                                        within: false,
                                    },
                                ],
                                [
                                    {
                                        letter: "m",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "y",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "o",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "r",
                                        correct: false,
                                        within: false,
                                    },
                                ],
                                [
                                    {
                                        letter: "l",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "e",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "f",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "y",
                                        correct: true,
                                        within: false,
                                    },
                                ],
                            ])
                        );
                    },
                });
                cy.waitForGameReady();

                // The win dialog should be visible first
                cy.contains("You win!").should("be.visible");

                // Close the end-game dialog
                cy.get(".dialog > .close").click();

                // After closing, the update prompt should now be displayed
                cy.get(".dialog").contains("New version available").should("be.visible");

                // Click "Yes" on the update prompt to open changelog
                cy.get(".dialog").contains("Yes").click();

                // Ensure changelog request was attempted and dialog shows changelog content
                cy.wait("@getChangelog");
                cy.get(".dialog").contains("Changelog").should("be.visible");
            });
        });
        describe("lost game", () => {
            it('should display lose dialog first, then display the update prompt once closed', () => {
                // Spy on changelog to ensure that changelog is fetched successfully
                cy.intercept("GET", "/CHANGELOG.html").as("getChangelog");

                // Reload page but preload localStorage so both an ended game and an old last_version exist
                cy.visit("/", {
                    onBeforeLoad: (win) => {
                        // mark played before so version prompt is eligible
                        win.localStorage.setItem("played_before", true);
                        // set to an old version to trigger update prompt
                        win.localStorage.setItem("last_version", "1.0.0");
                        // preload a completed (win) game so end-game dialog would be emitted on load
                        win.localStorage.setItem("ended", true);
                        win.localStorage.setItem("lives", 0);
                        // a final losing attempt
                        win.localStorage.setItem(
                            "attempts",
                            JSON.stringify(new Array(6).fill([
                                {
                                    letter: "a",
                                    correct: false,
                                    within: true,
                                },
                                {
                                    letter: "l",
                                    correct: false,
                                    within: true,
                                },
                                {
                                    letter: "p",
                                    correct: false,
                                    within: false,
                                },
                                {
                                    letter: "h",
                                    correct: false,
                                    within: false,
                                },
                                {
                                    letter: "a",
                                    correct: false,
                                    within: false,
                                },
                            ]))
                        );
                    },
                });
                cy.waitForGameReady();

                // The lose dialog should be visible first
                cy.contains("You lose!").should("be.visible");

                // Close the end-game dialog
                cy.get(".dialog > .close").click();

                // After closing, the update prompt should now be displayed
                cy.get(".dialog").contains("New version available").should("be.visible");

                // Click "Yes" on the update prompt to open changelog
                cy.get(".dialog").contains("Yes").click();

                // Ensure changelog request was attempted and dialog shows changelog content
                cy.wait("@getChangelog");
                cy.get(".dialog").contains("Changelog").should("be.visible");
            });
        });
    });
    
    describe("saved progress with a changelog prompt", () => {
        describe("won game", () => {
            it('should display the win dialog first, then the changelog prompt once closed', () => {
                // Spy on changelog to ensure that changelog is fetched successfully
                cy.intercept("GET", "/CHANGELOG.html").as("getChangelog");

                // First reload the page with an older version
                cy.visit("/", {
                    onBeforeLoad: (win) => {
                        // mark played before so version prompt is eligible
                        win.localStorage.setItem("played_before", true);
                        // set to an old version to trigger update prompt
                        win.localStorage.setItem("last_version", "1.0.0");
                        // preload a completed (win) game so end-game dialog would be emitted on load
                        win.localStorage.setItem("ended", true);
                        win.localStorage.setItem("lives", 3);
                        // a final winning attempt
                        win.localStorage.setItem(
                            "attempts",
                            JSON.stringify([
                                [
                                    {
                                        letter: "a",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "l",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "p",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "h",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: false,
                                        within: false,
                                    },
                                ],
                                [
                                    {
                                        letter: "m",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "y",
                                        correct: false,
                                        within: true,
                                    },
                                    {
                                        letter: "o",
                                        correct: false,
                                        within: false,
                                    },
                                    {
                                        letter: "r",
                                        correct: false,
                                        within: false,
                                    },
                                ],
                                [
                                    {
                                        letter: "l",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "e",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "a",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "f",
                                        correct: true,
                                        within: false,
                                    },
                                    {
                                        letter: "y",
                                        correct: true,
                                        within: false,
                                    },
                                ],
                            ])
                        );
                    },
                });
                cy.waitForGameReady();

                // The win dialog should be displayed first
                cy.contains("You win!").should("be.visible");

                // Close the end-game dialog
                cy.get(".dialog > .close").click();

                // The changelog prompt will then be displayed
                cy.get(".dialog").contains("Updated to version").should("be.visible");

                // Click "Yes" on the update prompt to open changelog
                cy.get(".dialog").contains("Yes").click();

                // Ensure changelog request was attempted and dialog shows changelog content
                cy.wait("@getChangelog");
                cy.get(".dialog").contains("Changelog").should("be.visible");

                cy.get(".dialog").within(() => {
                    cy.get(".close").should("be.visible").click();
                });
            });
        });
        describe("lost game", () => {
            it('should display the lose dialog first, then the changelog prompt once closed', () => {
                // Spy on changelog to ensure that changelog is fetched successfully
                cy.intercept("GET", "/CHANGELOG.html").as("getChangelog");

                // First reload the page with an older version
                cy.visit("/", {
                    onBeforeLoad: (win) => {
                        // mark played before so version prompt is eligible
                        win.localStorage.setItem("played_before", true);
                        // set to an old version to trigger update prompt
                        win.localStorage.setItem("last_version", "1.0.0");
                        // preload a completed (lose) game so end-game dialog would be emitted on load
                        win.localStorage.setItem("ended", true);
                        win.localStorage.setItem("lives", 0);
                        // a final losing attempt
                        win.localStorage.setItem(
                            "attempts",
                            JSON.stringify(new Array(6).fill([
                                {
                                    letter: "a",
                                    correct: false,
                                    within: true,
                                },
                                {
                                    letter: "l",
                                    correct: false,
                                    within: true,
                                },
                                {
                                    letter: "p",
                                    correct: false,
                                    within: false,
                                },
                                {
                                    letter: "h",
                                    correct: false,
                                    within: false,
                                },
                                {
                                    letter: "a",
                                    correct: false,
                                    within: false,
                                },
                            ]))
                        );
                    },
                });
                cy.waitForGameReady();

                // The lose dialog should be displayed first
                cy.contains("You lose!").should("be.visible");

                // Close the end-game dialog
                cy.get(".dialog > .close").click();

                // The changelog prompt will then be displayed
                cy.get(".dialog").contains("Updated to version").should("be.visible");

                // Click "Yes" on the update prompt to open changelog
                cy.get(".dialog").contains("Yes").click();

                // Ensure changelog request was attempted and dialog shows changelog content
                cy.wait("@getChangelog");
                cy.get(".dialog").contains("Changelog").should("be.visible");

                cy.get(".dialog").within(() => {
                    cy.get(".close").should("be.visible").click();
                });
            });
        });
    });
});
