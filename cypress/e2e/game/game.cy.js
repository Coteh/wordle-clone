/// <reference types="cypress" />

const DAY_MS = 86400000;

const KEYS_ARR = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "enter",
    "backspace",
];

describe("wordle clone", () => {
    beforeEach(() => {
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
            },
        });
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.reload();
        cy.waitForGameReady();
    });

    it("allows letter on touch keyboard to be pressed and labels the input boxes accordingly", () => {
        cy.currentRow().inputCell(1).inputLetter().should("be.empty");
        cy.keyboardItem("a").click();
        cy.currentRow().inputCell(1).inputLetter().should("have.text", "a");
    });

    it("accepts keyboard input as well", () => {
        cy.currentRow().inputCell(1).inputLetter().should("be.empty");
        cy.get("body").type("a");
        cy.currentRow().inputCell(1).inputLetter().should("have.text", "a");
    });

    it("removes the last letter input when backspace is pressed", () => {
        cy.get("body").type("b");
        cy.get("body").type("r");

        cy.currentRow().inputCell(1).inputLetter().should("have.text", "b");
        cy.currentRow().inputCell(2).inputLetter().should("have.text", "r");

        cy.get("body").type("{backspace}");

        cy.currentRow().inputCell(1).inputLetter().should("have.text", "b");
        cy.currentRow().inputCell(2).inputLetter().should("be.empty");
    });

    it("allows for backspace on the touch keyboard to be used to remove last letter", () => {
        cy.keyboardItem("b").click();
        cy.keyboardItem("r").click();

        cy.currentRow().inputCell(1).inputLetter().should("have.text", "b");
        cy.currentRow().inputCell(2).inputLetter().should("have.text", "r");

        cy.keyboardItem("backspace").click();

        cy.currentRow().inputCell(1).inputLetter().should("have.text", "b");
        cy.currentRow().inputCell(2).inputLetter().should("be.empty");
    });

    it("allows for enter on the touch keyboard to be used to submit word and select the next row", () => {
        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("e").click();

        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.keyboardItem("enter").click();

        cy.inputRow(1).should("not.have.id", "current-input");
        cy.inputRow(2).should("have.id", "current-input");
    });

    it("allows enter key on the keyboard to submit word and select the next row", () => {
        cy.get("body").type("s");
        cy.get("body").type("p");
        cy.get("body").type("i");
        cy.get("body").type("c");
        cy.get("body").type("e");

        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.get("body").type("{enter}");

        cy.inputRow(1).should("not.have.id", "current-input");
        cy.inputRow(2).should("have.id", "current-input");
    });

    it("should allow for player to input on the next row after a valid submission", () => {
        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("e").click();

        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "s");
        cy.inputRow(1).inputCell(5).inputLetter().should("have.text", "e");
        cy.inputRow(2).inputCell(1).inputLetter().should("be.empty");
        cy.inputRow(2).inputCell(5).inputLetter().should("be.empty");

        cy.keyboardItem("enter").click();

        cy.keyboardItem("w").click();
        cy.keyboardItem("r").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("t").click();
        cy.keyboardItem("h").click();

        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "s");
        cy.inputRow(1).inputCell(5).inputLetter().should("have.text", "e");
        cy.inputRow(2).inputCell(1).inputLetter().should("have.text", "w");
        cy.inputRow(2).inputCell(5).inputLetter().should("have.text", "h");
    });

    it("handles case where enter was pressed and not enough letters were entered", () => {
        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("i").click();

        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "s");
        cy.inputRow(1).inputCell(2).inputLetter().should("have.text", "p");
        cy.inputRow(1).inputCell(3).inputLetter().should("have.text", "i");
        cy.inputRow(1).inputCell(4).inputLetter().should("be.empty");
        cy.inputRow(1).inputCell(5).inputLetter().should("be.empty");

        cy.contains("Not enough letters").should("not.exist");
        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.keyboardItem("enter").click();

        cy.contains("Not enough letters").should("be.visible");
        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");
    });

    it("handles case where word entered was invalid", () => {
        cy.keyboardItem("a").click();
        cy.keyboardItem("b").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("d").click();
        cy.keyboardItem("e").click();

        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "a");
        cy.inputRow(1).inputCell(2).inputLetter().should("have.text", "b");
        cy.inputRow(1).inputCell(3).inputLetter().should("have.text", "c");
        cy.inputRow(1).inputCell(4).inputLetter().should("have.text", "d");
        cy.inputRow(1).inputCell(5).inputLetter().should("have.text", "e");

        cy.contains("Not in word list").should("not.exist");
        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.keyboardItem("enter").click();

        cy.contains("Not in word list").should("be.visible");
        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");
    });

    it("should display word correctness when submitted", () => {
        cy.keyboardItem("p").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("z").click();
        cy.keyboardItem("a").click();

        cy.inputRow(1).inputCell(1).should("not.have.class", "incorrect");
        cy.inputRow(1).inputCell(2).should("not.have.class", "within");
        cy.inputRow(1).inputCell(3).should("not.have.class", "correct");
        cy.inputRow(1).inputCell(4).should("not.have.class", "incorrect");
        cy.inputRow(1).inputCell(5).should("not.have.class", "incorrect");

        cy.keyboardItem("enter").click();

        cy.inputRow(1).inputCell(1).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(2).should("have.class", "within");
        cy.inputRow(1).inputCell(3).should("have.class", "correct");
        cy.inputRow(1).inputCell(4).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(5).should("have.class", "incorrect");
    });

    it("should display word correctness when page is reloaded", () => {
        cy.keyboardItem("p").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("z").click();
        cy.keyboardItem("a").click();

        cy.inputRow(1).inputCell(1).should("not.have.class", "incorrect");
        cy.inputRow(1).inputCell(2).should("not.have.class", "within");
        cy.inputRow(1).inputCell(3).should("not.have.class", "correct");
        cy.inputRow(1).inputCell(4).should("not.have.class", "incorrect");
        cy.inputRow(1).inputCell(5).should("not.have.class", "incorrect");

        cy.keyboardItem("enter").click();

        cy.reload();

        cy.inputRow(1).inputCell(1).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(2).should("have.class", "within");
        cy.inputRow(1).inputCell(3).should("have.class", "correct");
        cy.inputRow(1).inputCell(4).should("have.class", "incorrect");
        cy.inputRow(1).inputCell(5).should("have.class", "incorrect");
    });

    it("updates touch keyboard with updated statuses for each letter when word submitted", () => {
        cy.keyboardItem("p").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("z").click();
        cy.keyboardItem("a").click();

        cy.keyboardItem("p").should("not.have.class", "incorrect");
        cy.keyboardItem("l").should("not.have.class", "within");
        cy.keyboardItem("a").should("not.have.class", "correct");
        cy.keyboardItem("z").should("not.have.class", "incorrect");

        cy.keyboardItem("enter").click();

        cy.keyboardItem("p").should("have.class", "incorrect");
        cy.keyboardItem("l").should("have.class", "within");
        cy.keyboardItem("a").should("have.class", "correct");
        cy.keyboardItem("z").should("have.class", "incorrect");
    });

    describe("when player wins", () => {
        beforeEach(() => {
            cy.keyboardItem("l").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("f").click();
            cy.keyboardItem("y").click();

            cy.keyboardItem("enter").click();
        });

        it("displays win message", () => {
            cy.contains("You win!").should("be.visible");
        });

        it("does not progress the input row", () => {
            cy.inputRow(1).should("have.id", "current-input");
            cy.inputRow(2).should("not.have.id", "current-input");
        });

        [
            {
                name: "backspace",
                input: "backspace",
            },
            {
                name: "f key",
                input: "f",
            },
            {
                name: "enter key",
                input: "enter",
            },
        ].forEach((def) => {
            it(`prevents player from making any more inputs on the touch keyboard after closing dialog - case '${def.name}'`, () => {
                cy.inputRowHasWord(1, "leafy");
                for (let i = 2; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.inputRow(1).should("have.id", "current-input");
                cy.inputRow(2).should("not.have.id", "current-input");

                cy.get(".overlay-back").click("left");

                cy.keyboardItem(def.input).click();

                cy.inputRowHasWord(1, "leafy");
                for (let i = 2; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.inputRow(1).should("have.id", "current-input");
                cy.inputRow(2).should("not.have.id", "current-input");
            });
        });

        it("prevents player from making any more inputs with physical keyboard after closing dialog", () => {
            cy.get(".overlay-back").click("left");

            cy.inputRowHasWord(1, "leafy");
            for (let i = 2; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.get("body").type("{backspace}");

            cy.inputRowHasWord(1, "leafy");
            for (let i = 2; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.get("body").type("f");

            cy.inputRowHasWord(1, "leafy");
            for (let i = 2; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.inputRow(1).should("have.id", "current-input");
            cy.inputRow(2).should("not.have.id", "current-input");

            cy.get("body").type("{enter}");

            cy.inputRowHasWord(1, "leafy");
            for (let i = 2; i <= 6; i++) {
                cy.inputRowShouldBeEmpty(i);
            }

            cy.inputRow(1).should("have.id", "current-input");
            cy.inputRow(2).should("not.have.id", "current-input");
        });

        it("counts down to next day's Wordle", () => {
            cy.contains("Next Wordle: 12:00:00").should("be.visible");
            cy.tick(1000);
            cy.contains("Next Wordle: 11:59:59").should("be.visible");
        });
    });

    describe("when player loses", () => {
        beforeEach(() => {
            for (let i = 0; i < 6; i++) {
                cy.keyboardItem("b").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("r").click();
                cy.keyboardItem("g").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();
            }
        });

        it("displays lose message", () => {
            cy.contains("You lose!").should("be.visible");
            cy.contains("word was leafy").should("be.visible");
        });

        it("does not progress the input row", () => {
            cy.inputRow(6).should("have.id", "current-input");
        });

        [
            {
                name: "backspace",
                input: "backspace",
            },
            {
                name: "f key",
                input: "f",
            },
            {
                name: "enter key",
                input: "enter",
            },
        ].forEach((def) => {
            it(`prevents player from making any more inputs on the touch keyboard after closing dialog - case '${def.name}'`, () => {
                for (let i = 1; i <= 6; i++) {
                    cy.inputRowHasWord(i, "barge");
                }

                cy.inputRow(6).should("have.id", "current-input");

                cy.get(".overlay-back").click("left");

                cy.keyboardItem(def.input).click();

                for (let i = 1; i <= 6; i++) {
                    cy.inputRowHasWord(i, "barge");
                }

                cy.inputRow(6).should("have.id", "current-input");
            });
        });

        it("prevents player from making any more inputs with physical keyboard after closing dialog", () => {
            cy.get(".overlay-back").click("left");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowHasWord(i, "barge");
            }

            cy.get("body").type("{backspace}");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowHasWord(i, "barge");
            }

            cy.get("body").type("f");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowHasWord(i, "barge");
            }

            cy.inputRow(6).should("have.id", "current-input");

            cy.get("body").type("{enter}");

            for (let i = 1; i <= 6; i++) {
                cy.inputRowHasWord(i, "barge");
            }

            cy.inputRow(6).should("have.id", "current-input");
        });

        it("counts down to next day's Wordle", () => {
            cy.contains("Next Wordle: 12:00:00").should("be.visible");
            cy.tick(1000);
            cy.contains("Next Wordle: 11:59:59").should("be.visible");
        });
    });

    describe("loading word of the day", () => {
        beforeEach(() => {
            // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
            // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
            cy.clock(DAY_MS * 1, ["Date"]);
        });
        it("should handle word list from server", () => {
            cy.intercept("/words.txt", {
                fixture: "words.txt",
            });
            cy.clearBrowserCache();
            cy.reload();
            cy.fixture("words.txt").then((file) => {
                const expectedWord = file.split("\n")[1];
                cy.keyboardItem("l").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("f").click();
                cy.keyboardItem("y").click();
                cy.keyboardItem("enter").click();
                cy.contains("You win!").should("be.visible");
            });
        });
        it("should handle gracefully if word list cannot be handled", () => {
            cy.intercept("GET", "/words.txt", {
                statusCode: 404,
                body: "Not found",
            });
            cy.clearBrowserCache();
            cy.reload();
            cy.contains("Could not fetch word list.").should("be.visible");
            // The error dialog should not close
            cy.get(".overlay-back").click("left");
            cy.contains("Could not fetch word list.").should("be.visible");
        });
    });

    describe("retrieving saved progress", () => {
        beforeEach(() => {
            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem("day", 1);
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
            window.localStorage.setItem("day", 0);

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

    // NOTE: If viewing this set of tests on Cypress UI, make sure the browser is active and you've allowed clipboard access when prompted
    describe("sharing results", () => {
        const performAction = () => {
            cy.keyboardItem("g").click();
            cy.keyboardItem("l").click();
            cy.keyboardItem("i").click();
            cy.keyboardItem("d").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("enter").click();

            cy.keyboardItem("l").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("f").click();
            cy.keyboardItem("y").click();
            cy.keyboardItem("enter").click();

            cy.get(".share-button").click();
        };

        it("should copy the results to clipboard when share button is pressed", () => {
            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performAction();

            cy.window().then((win) => {
                win.navigator.clipboard.readText().then((text) => {
                    expect(text).to.eq(`Wordle Clone 2 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
                });
            });
        });

        it("should show a message when results have been copied", () => {
            performAction();

            cy.contains("Copied to clipboard").should("be.visible");
        });

        it("should handle copy failure", () => {
            const PREV_COPIED_TEXT = "This text should still be copied after failure to copy";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
                win.navigator.clipboard.writeText = cy.stub().rejects(new Error("Error copying"));
            });

            performAction();

            cy.contains("Could not copy to clipboard due to error").should("be.visible");

            cy.window().then((win) => {
                win.navigator.clipboard.readText().then((text) => {
                    expect(text).to.eq(PREV_COPIED_TEXT);
                });
            });
        });
    });

    describe("how to play", () => {
        beforeEach(() => {
            window.localStorage.setItem("played_before", false);
            cy.contains("How to play").should("not.exist");
            cy.reload();
            cy.waitForGameReady();
        });

        it("should appear when player first starts the game", () => {
            cy.contains("How to play").should("be.visible");
        });

        it("should not appear again after the first time game is loaded", () => {
            cy.reload();
            cy.waitForGameReady();
            cy.contains("How to play").should("not.exist");
        });

        it("can be brought up at any time by clicking on the help icon", () => {
            cy.reload();
            cy.waitForGameReady();
            cy.contains("How to play").should("not.exist");
            cy.get(".help-link").click();
            cy.contains("How to play").should("be.visible");
        });

        it("can be closed by pressing enter key after clicking help icon", () => {
            cy.reload();
            cy.waitForGameReady();

            cy.contains("How to play").should("not.exist");
            cy.get(".help-link").click();
            cy.contains("How to play").should("be.visible");

            cy.get(".dialog").should("be.visible");
            cy.get(".overlay-back").should("be.visible");

            // Need to use cypress-real-events realType method to simulate a "real" enter key press to trigger the exact scenario
            // that happens in real browser where the browser is still focused on the help link at this point and triggers the help dialog again.
            cy.get(".help-link").realType("{enter}");

            cy.get(".dialog").should("not.exist");
            cy.get(".overlay-back").should("not.be.visible");
        });
    });

    describe("dialogs", () => {
        beforeEach(() => {
            // The How to Play dialog is an example of a closable dialog that can be triggered in normal usage
            cy.get(".help-link").click();
        });

        describe("general dialog behaviour", () => {
            it("should be visible", () => {
                cy.get(".dialog").should("be.visible");
                cy.get(".overlay-back").should("be.visible");
            });

            [
                {
                    name: "backspace",
                    input: "backspace",
                },
                {
                    name: "f key",
                    input: "f",
                },
                {
                    name: "enter key",
                    input: "enter",
                },
            ].forEach((def) => {
                it(`prevents inputs from being made on touch keyboard - case '${def.name}'`, (done) => {
                    cy.keyboardItem(def.input).shouldNotBeActionable(done);
                });
            });

            it("prevents player from making any more inputs with physical keyboard", () => {
                for (let i = 1; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.get("body").type("{backspace}");

                for (let i = 1; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.get("body").type("f");

                for (let i = 1; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.inputRow(1).should("have.id", "current-input");
                cy.inputRow(2).should("not.have.id", "current-input");

                cy.get("body").type("{enter}");

                for (let i = 1; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.inputRow(1).should("have.id", "current-input");
                cy.inputRow(2).should("not.have.id", "current-input");
            });

            // NTS: If dialog does not appear on the screen for some reason, which should never happen anyway under normal operation, then player can make physical key inputs.
            // At this time, I'm not going to handle this case since behaviour would already be undefined at that point; thus, handling this particular case may be a bit too much.
        });

        describe("closable dialogs", () => {
            it("can be closed by clicking on the X button", () => {
                cy.get(".dialog").should("be.visible");
                cy.get(".overlay-back").should("be.visible");

                cy.get(".dialog > .close").click();

                cy.get(".dialog").should("not.exist");
                cy.get(".overlay-back").should("not.be.visible");
            });

            it("can be closed by clicking elsewhere besides the dialog", () => {
                cy.get(".dialog").should("be.visible");
                cy.get(".overlay-back").should("be.visible");

                cy.get("body").click({
                    position: "left",
                });

                cy.get(".dialog").should("not.exist");
                cy.get(".overlay-back").should("not.be.visible");
            });

            it("allows inputs to be made again after closing", () => {
                cy.get("body").type("b");

                for (let i = 1; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }

                cy.get(".dialog > .close").click();

                cy.get("body").type("b");

                cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "b");
                for (let i = 2; i <= 5; i++) {
                    cy.inputRow(1).inputCell(i).inputLetter().should("be.empty");
                }
                for (let i = 2; i <= 6; i++) {
                    cy.inputRowShouldBeEmpty(i);
                }
            });

            it("can be closed by pressing enter key", () => {
                cy.get(".dialog").should("be.visible");
                cy.get(".overlay-back").should("be.visible");

                cy.get("body").type("{enter}");

                cy.get(".dialog").should("not.exist");
                cy.get(".overlay-back").should("not.be.visible");
            });

            it("can be closed by pressing escape key", () => {
                cy.get(".dialog").should("be.visible");
                cy.get(".overlay-back").should("be.visible");

                cy.get("body").type("{esc}");

                cy.get(".dialog").should("not.exist");
                cy.get(".overlay-back").should("not.be.visible");
            });
        });

        describe("non-closable dialogs", () => {
            beforeEach(() => {
                // The error dialog is an example of a non-closable dialog that can be triggered in normal usage
                cy.intercept("GET", "/words.txt", {
                    statusCode: 404,
                    body: "Not found",
                });
                cy.clearBrowserCache();
                cy.reload();
            });

            it("hides X button and cannot be clicked", () => {
                cy.get(".dialog").should("be.visible");

                cy.get(".dialog > .close").should("not.be.visible").click({
                    force: true,
                });

                cy.get(".dialog").should("be.visible");
            });

            it("can not be closed by clicking elsewhere besides the dialog", () => {
                cy.get(".dialog").should("be.visible");

                cy.get("body").click({
                    position: "left",
                });

                cy.get(".dialog").should("be.visible");
            });
        });
    });

    describe("viewport", () => {
        [
            {
                name: "small mobile device",
                width: 320,
                height: 480,
            },
            {
                name: "medium mobile device",
                width: 375,
                height: 667,
            },
            {
                name: "large mobile device",
                width: 375,
                height: 812,
            },
            {
                name: "huge mobile device",
                width: 428,
                height: 926,
            },
            {
                name: "tablet (portrait)",
                width: 768,
                height: 1024,
            },
            {
                name: "tablet (landscape)",
                width: 1024,
                height: 768,
            },
        ].forEach((def) => {
            it(`should be playable on a ${def.name}`, () => {
                cy.viewport(def.width, def.height);

                for (let i = 0; i < KEYS_ARR.length; i++) {
                    cy.keyboardItem(KEYS_ARR[i]).shouldBeInViewport();
                }
                for (let i = 1; i <= 6; i++) {
                    for (let j = 1; j <= 5; j++) {
                        cy.inputRow(i).inputCell(j).shouldBeInViewport();
                    }
                }
                cy.contains("Wordle Clone").shouldBeInViewport();
                cy.contains("Day 2").shouldBeInViewport();
                cy.get(".help-link").shouldBeInViewport();

                cy.keyboardItem("b").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("r").click();
                cy.keyboardItem("g").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();

                cy.keyboardItem("t").click();
                cy.keyboardItem("o").click();
                cy.keyboardItem("o").click();
                cy.keyboardItem("backspace").click();
                cy.keyboardItem("backspace").click();
                cy.keyboardItem("backspace").click();
                cy.keyboardItem("l").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("f").click();
                cy.keyboardItem("y").click();
                cy.keyboardItem("enter").click();

                cy.task("log", "Checking dialog placement...");

                // The dialog should appear in center of screen after 0.5s because that's the duration of the CSS transition
                // Adding an extra 0.5s to accommodate for the occasional delay that could potentially happen on CI runner
                // TODO: still need to look into this fully
                cy.wait(1000);

                cy.contains("You win!").shouldBeInViewport();
                cy.contains("Next Wordle").shouldBeInViewport();
            });
        });
    });
});
