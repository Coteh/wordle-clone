/// <reference types="cypress" />

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
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
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
});
