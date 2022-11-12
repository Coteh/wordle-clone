/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;
const FIRST_DAY = 19074;

const KEY_HOLD_TIMEOUT_MS = 500;

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

describe("gameplay", () => {
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

    it("handles player attempting to enter more than five letters on a single row", () => {
        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("y").click();

        cy.inputRowHasWord(1, "spice");
        for (let i = 2; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        // Despite entering six letters, pressing backspace once should still remove the fifth letter since the sixth was rejected

        cy.keyboardItem("backspace").click();

        cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "s");
        cy.inputRow(1).inputCell(2).inputLetter().should("have.text", "p");
        cy.inputRow(1).inputCell(3).inputLetter().should("have.text", "i");
        cy.inputRow(1).inputCell(4).inputLetter().should("have.text", "c");
        cy.inputRow(1).inputCell(5).inputLetter().should("be.empty");
        for (let i = 2; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.keyboardItem("enter").click();

        cy.contains("Not enough letters").should("be.visible");

        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");
    });

    it("handles player attempting to delete letters on an empty row", () => {
        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("backspace").click();
        cy.keyboardItem("backspace").click();
        cy.keyboardItem("backspace").click();

        for (let i = 1; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        // Despite pressing backspace one too many times, player should be able to type a full word and submit it

        cy.keyboardItem("s").click();
        cy.keyboardItem("p").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("c").click();
        cy.keyboardItem("e").click();

        cy.inputRowHasWord(1, "spice");
        for (let i = 2; i <= 6; i++) {
            cy.inputRowShouldBeEmpty(i);
        }

        cy.inputRow(1).should("have.id", "current-input");
        cy.inputRow(2).should("not.have.id", "current-input");

        cy.get("body").type("{enter}");

        cy.inputRow(1).should("not.have.id", "current-input");
        cy.inputRow(2).should("have.id", "current-input");
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

    describe("touchscreen keyboard press", () => {
        ["touch", "mouse"].forEach((type) => {
            describe(`when player presses down a key - ${type}`, () => {
                beforeEach(() => {
                    cy.keyboardItem("a").trigger(type === "mouse" ? "mousedown" : "touchstart");
                });

                it("should change the key to pressed state", () => {
                    cy.keyboardItem("a").should("have.class", "pressed");
                    cy.keyboardItem("a").should("not.have.class", "held");

                    cy.wait(100);
                    cy.keyboardItem("a").trigger(type === "mouse" ? "mouseup" : "touchend");
                });
            });

            describe(`when player holds down a key past threshold - ${type}`, () => {
                beforeEach(() => {
                    cy.keyboardItem("a").trigger(type === "mouse" ? "mousedown" : "touchstart");
                    cy.wait(KEY_HOLD_TIMEOUT_MS);
                });

                it("should change the key to held state", () => {
                    cy.keyboardItem("a").should("have.class", "held");
                    cy.keyboardItem("a").should("not.have.class", "pressed");
                });
            });

            describe(`when player releases a key - ${type}`, () => {
                beforeEach(() => {
                    cy.keyboardItem("p").click();
                    cy.keyboardItem("l").click();
                    cy.keyboardItem("a").click();
                    cy.keyboardItem("z").click();
                    cy.keyboardItem("a").click();

                    cy.keyboardItem("enter").click();

                    cy.keyboardItem("p").should("have.class", "incorrect");
                    cy.keyboardItem("l").should("have.class", "within");
                    cy.keyboardItem("a").should("have.class", "correct");
                    cy.keyboardItem("z").should("have.class", "incorrect");
                });

                it("should change the key back to normal state if it has no letter status", () => {
                    cy.keyboardItem("d").as("d");

                    cy.get("@d").should("have.class", "standard");
                    cy.get("@d").should("not.have.class", "pressed");

                    cy.get("@d").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@d").should("have.class", "pressed");
                    cy.get("@d").should("not.have.class", "standard");

                    cy.wait(100);
                    cy.get("@d").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@d").should("have.class", "standard");
                    cy.get("@d").should("not.have.class", "pressed");
                });

                it("should change the key back to correct state if the letter is correct", () => {
                    cy.keyboardItem("a").as("a");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");

                    cy.get("@a").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@a").should("have.class", "pressed");
                    cy.get("@a").should("not.have.class", "correct");

                    cy.wait(100);
                    cy.get("@a").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");
                });

                it("should change the key back to within status if the letter is within", () => {
                    cy.keyboardItem("l").as("l");

                    cy.get("@l").should("have.class", "within");
                    cy.get("@l").should("not.have.class", "pressed");

                    cy.get("@l").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@l").should("have.class", "pressed");
                    cy.get("@l").should("not.have.class", "within");

                    cy.wait(100);
                    cy.get("@l").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@l").should("have.class", "within");
                    cy.get("@l").should("not.have.class", "pressed");
                });

                it("should change the key back to incorrect state if the letter is incorrect", () => {
                    cy.keyboardItem("p").as("p");

                    cy.get("@p").should("have.class", "incorrect");
                    cy.get("@p").should("not.have.class", "pressed");

                    cy.get("@p").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@p").should("have.class", "pressed");
                    cy.get("@p").should("not.have.class", "incorrect");

                    cy.wait(100);
                    cy.get("@p").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@p").should("have.class", "incorrect");
                    cy.get("@p").should("not.have.class", "pressed");
                });
            });

            describe(`when player presses down a key and game is over - ${type}`, () => {
                beforeEach(() => {
                    for (let i = 0; i < 6; i++) {
                        cy.keyboardItem("p").click();
                        cy.keyboardItem("l").click();
                        cy.keyboardItem("a").click();
                        cy.keyboardItem("z").click();
                        cy.keyboardItem("a").click();

                        cy.keyboardItem("enter").click();
                    }

                    cy.contains("You lose!").should("be.visible");

                    cy.get(".dialog > .close").click();
                });

                it("should not change the key state", () => {
                    cy.keyboardItem("a").as("a");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");

                    cy.get("@a").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");

                    cy.get("@a").trigger(type === "mouse" ? "mouseup" : "touchend");
                });
            });

            describe(`when player holds down a key past threshold and game is over - ${type}`, () => {
                beforeEach(() => {
                    for (let i = 0; i < 6; i++) {
                        cy.keyboardItem("p").click();
                        cy.keyboardItem("l").click();
                        cy.keyboardItem("a").click();
                        cy.keyboardItem("z").click();
                        cy.keyboardItem("a").click();

                        cy.keyboardItem("enter").click();
                    }

                    cy.contains("You lose!").should("be.visible");

                    cy.get(".dialog > .close").click();
                });

                it("should not change the key state", () => {
                    cy.keyboardItem("a").as("a");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "held");

                    cy.get("@a").trigger(type === "mouse" ? "mousedown" : "touchstart");
                    cy.wait(KEY_HOLD_TIMEOUT_MS);

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "held");

                    cy.get("@a").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "held");
                });
            });

            describe(`when player releases a key and game is over - ${type}`, () => {
                beforeEach(() => {
                    for (let i = 0; i < 6; i++) {
                        cy.keyboardItem("p").click();
                        cy.keyboardItem("l").click();
                        cy.keyboardItem("a").click();
                        cy.keyboardItem("z").click();
                        cy.keyboardItem("a").click();

                        cy.keyboardItem("enter").click();
                    }

                    cy.contains("You lose!").should("be.visible");

                    cy.get(".dialog > .close").click();
                });

                it("should not change the key state", () => {
                    cy.keyboardItem("a").as("a");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");

                    cy.get("@a").trigger(type === "mouse" ? "mousedown" : "touchstart");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");

                    cy.wait(100);
                    cy.get("@a").trigger(type === "mouse" ? "mouseup" : "touchend");

                    cy.get("@a").should("have.class", "correct");
                    cy.get("@a").should("not.have.class", "pressed");
                });
            });

            describe(`when player holds backspace key and there's a row of input - ${type}`, () => {
                beforeEach(() => {
                    cy.keyboardItem("p").click();
                    cy.keyboardItem("l").click();
                    cy.keyboardItem("a").click();
                    cy.keyboardItem("z").click();
                    cy.keyboardItem("a").click();

                    cy.inputRowHasWord(1, "plaza");

                    cy.keyboardItem("backspace").trigger(
                        type === "mouse" ? "mousedown" : "touchstart"
                    );
                    cy.wait(KEY_HOLD_TIMEOUT_MS);
                    cy.tick(KEY_HOLD_TIMEOUT_MS); // have to advance the clock manually as well since it's mocked
                    cy.keyboardItem("backspace").trigger(type === "mouse" ? "mouseup" : "touchend");
                });

                it("should backspace all letters in the current row", () => {
                    cy.inputRowShouldBeEmpty(1);

                    cy.keyboardItem("p").click();
                    cy.keyboardItem("l").click();
                    cy.keyboardItem("a").click();
                    cy.keyboardItem("z").click();
                    cy.keyboardItem("a").click();

                    cy.inputRowHasWord(1, "plaza");

                    cy.inputRow(1).should("have.id", "current-input");
                    cy.inputRow(2).should("not.have.id", "current-input");

                    cy.keyboardItem("enter").click();

                    cy.inputRow(1).should("not.have.id", "current-input");
                    cy.inputRow(2).should("have.id", "current-input");
                });
            });

            describe(`when player holds backspace key and half the row has letters - ${type}`, () => {
                beforeEach(() => {
                    cy.keyboardItem("p").click();
                    cy.keyboardItem("l").click();
                    cy.keyboardItem("a").click();

                    cy.inputRow(1).inputCell(1).inputLetter().should("have.text", "p");
                    cy.inputRow(1).inputCell(2).inputLetter().should("have.text", "l");
                    cy.inputRow(1).inputCell(3).inputLetter().should("have.text", "a");

                    cy.keyboardItem("backspace").trigger(
                        type === "mouse" ? "mousedown" : "touchstart"
                    );
                    cy.wait(KEY_HOLD_TIMEOUT_MS);
                    cy.tick(KEY_HOLD_TIMEOUT_MS); // have to advance the clock manually as well since it's mocked
                    cy.keyboardItem("backspace").trigger(type === "mouse" ? "mouseup" : "touchend");
                });

                it("should backspace all letters in the current row", () => {
                    cy.inputRowShouldBeEmpty(1, "");
                });
            });

            describe(`when player holds backspace key and game is over - ${type}`, () => {
                beforeEach(() => {
                    for (let i = 0; i < 6; i++) {
                        cy.keyboardItem("p").click();
                        cy.keyboardItem("l").click();
                        cy.keyboardItem("a").click();
                        cy.keyboardItem("z").click();
                        cy.keyboardItem("a").click();

                        cy.keyboardItem("enter").click();
                    }

                    cy.contains("You lose!").should("be.visible");

                    cy.get(".dialog > .close").click();

                    for (let i = 1; i <= 6; i++) {
                        cy.inputRowHasWord(i, "plaza");
                    }

                    cy.keyboardItem("backspace").trigger(
                        type === "mouse" ? "mousedown" : "touchstart"
                    );
                    cy.wait(KEY_HOLD_TIMEOUT_MS);
                    cy.tick(KEY_HOLD_TIMEOUT_MS); // have to advance the clock manually as well since it's mocked
                    cy.keyboardItem("backspace").trigger(type === "mouse" ? "mouseup" : "touchend");
                });

                it("should not backspace anything", () => {
                    for (let i = 1; i <= 6; i++) {
                        cy.inputRowHasWord(i, "plaza");
                    }
                });
            });

            describe(`when player holds backspace key and there is no input - ${type}`, () => {
                beforeEach(() => {
                    for (let i = 0; i < 3; i++) {
                        cy.keyboardItem("p").click();
                        cy.keyboardItem("l").click();
                        cy.keyboardItem("a").click();
                        cy.keyboardItem("z").click();
                        cy.keyboardItem("a").click();

                        cy.keyboardItem("enter").click();
                    }

                    for (let i = 1; i <= 3; i++) {
                        cy.inputRowHasWord(i, "plaza");
                    }
                    for (let i = 4; i <= 6; i++) {
                        cy.inputRowShouldBeEmpty(i);
                    }

                    cy.keyboardItem("backspace").trigger(
                        type === "mouse" ? "mousedown" : "touchstart"
                    );
                    cy.wait(KEY_HOLD_TIMEOUT_MS);
                    cy.tick(KEY_HOLD_TIMEOUT_MS); // have to advance the clock manually as well since it's mocked
                    cy.keyboardItem("backspace").trigger(type === "mouse" ? "mouseup" : "touchend");
                });

                it("should not backspace anything", () => {
                    for (let i = 1; i <= 3; i++) {
                        cy.inputRowHasWord(i, "plaza");
                    }
                    for (let i = 4; i <= 6; i++) {
                        cy.inputRowShouldBeEmpty(i);
                    }
                });
            });
        });

        describe("when player holds down a key then it gets cancelled", () => {
            it("should change the key back to its previous state", () => {
                cy.keyboardItem("p").click();
                cy.keyboardItem("l").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("z").click();
                cy.keyboardItem("a").click();

                cy.keyboardItem("enter").click();

                cy.keyboardItem("p").should("have.class", "incorrect");
                cy.keyboardItem("l").should("have.class", "within");
                cy.keyboardItem("a").should("have.class", "correct");
                cy.keyboardItem("z").should("have.class", "incorrect");

                cy.keyboardItem("p").as("p");

                cy.get("@p").should("have.class", "incorrect");
                cy.get("@p").should("not.have.class", "pressed");

                cy.get("@p").trigger("touchstart");

                cy.get("@p").should("have.class", "pressed");
                cy.get("@p").should("not.have.class", "incorrect");

                cy.wait(100);
                cy.get("@p").trigger("touchcancel");

                cy.get("@p").should("have.class", "incorrect");
                cy.get("@p").should("not.have.class", "pressed");
            });
        });
    });
});
