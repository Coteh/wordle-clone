const {
    checkForWord,
    WORDS_DIFFERENT_LENGTH_ERROR_ID,
    NOT_IN_WORD_LIST_ERROR_ID,
    WORD_NOT_PROVIDED_ERROR_ID,
    USER_INPUT_NOT_PROVIDED_ERROR_ID,
} = require("../src/game");
const assert = require("assert");
const fs = require("fs");

const getEntryString = (entry) => `(${entry.letter}, ${entry.correct}, ${entry.within})`;

const assertEntry = (actual, expected, index) => {
    assert(Object.keys(actual).length === 3);
    try {
        assert(actual.letter === expected.letter);
        assert(actual.expected === expected.expected);
        assert(actual.within === expected.within);
    } catch (e) {
        throw new Error(
            `${index} - ${getEntryString(actual)} does not match ${getEntryString(expected)}`
        );
    }
};

const wordList = [...fs.readFileSync("words.txt").toString("utf-8").trimEnd().split("\n"), "tests"];

describe("core game logic", () => {
    it("should determine letter correctness (basic test)", () => {
        const expected = [
            {
                letter: "c",
                correct: true,
                within: false,
            },
            {
                letter: "l",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: false,
                within: true,
            },
            {
                letter: "s",
                correct: false,
                within: true,
            },
            {
                letter: "e",
                correct: false,
                within: true,
            },
        ];
        const result = checkForWord("close", "codes", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("should determine a match if all letters are correct", () => {
        const expected = [
            {
                letter: "e",
                correct: true,
                within: false,
            },
            {
                letter: "x",
                correct: true,
                within: false,
            },
            {
                letter: "a",
                correct: true,
                within: false,
            },
            {
                letter: "c",
                correct: true,
                within: false,
            },
            {
                letter: "t",
                correct: true,
                within: false,
            },
        ];
        const result = checkForWord("exact", "exact", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("should determine no matches for any letter if none of the letters are correct", () => {
        const expected = [
            {
                letter: "w",
                correct: false,
                within: false,
            },
            {
                letter: "r",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: false,
                within: false,
            },
            {
                letter: "n",
                correct: false,
                within: false,
            },
            {
                letter: "g",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("wrong", "types", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("should determine that all letters in the input exist within the word if they're all out of place", () => {
        const expected = [
            {
                letter: "h",
                correct: false,
                within: true,
            },
            {
                letter: "e",
                correct: false,
                within: true,
            },
            {
                letter: "a",
                correct: false,
                within: true,
            },
            {
                letter: "r",
                correct: false,
                within: true,
            },
            {
                letter: "t",
                correct: false,
                within: true,
            },
        ];
        const result = checkForWord("heart", "earth", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("cannot validate a non-word", () => {
        const result = checkForWord("asdfg", "codes", wordList);
        assert(result.error === NOT_IN_WORD_LIST_ERROR_ID);
    });
    it("cannot repeat a hint", () => {
        const expected = [
            {
                letter: "r",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: false,
                within: true,
            },
            {
                letter: "b",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: false,
                within: false,
            },
            {
                letter: "t",
                correct: false,
                within: true,
            },
        ];
        const result = checkForWord("robot", "stomp", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("can show a hint for a duplicate letter if one of them is correct and the other is within", () => {
        const expected = [
            {
                letter: "r",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: true,
                within: true,
            },
            {
                letter: "b",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: false,
                within: true,
            },
            {
                letter: "t",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("robot", "looks", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("should not show a hint if letter is already matched", () => {
        const expected = [
            {
                letter: "t",
                correct: false,
                within: false,
            },
            {
                letter: "e",
                correct: false,
                within: false,
            },
            {
                letter: "s",
                correct: false,
                within: false,
            },
            {
                letter: "t",
                correct: false,
                within: false,
            },
            {
                letter: "s",
                correct: true,
                within: false,
            },
        ];
        const result = checkForWord("tests", "grams", wordList);
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
    it("should return an error if user input is different length from the word", () => {
        const result = checkForWord("code", "codes", wordList);
        assert(result.error === WORDS_DIFFERENT_LENGTH_ERROR_ID);
    });
    it("should return an error if user input was not provided", () => {
        const result = checkForWord(undefined, "codes", wordList);
        assert(result.error === USER_INPUT_NOT_PROVIDED_ERROR_ID);
    });
    it("should return an error if word is not provided", () => {
        const result = checkForWord("code", undefined, wordList);
        assert(result.error === WORD_NOT_PROVIDED_ERROR_ID);
    });
    it("should not check word list if word list was not provided", () => {
        const expected = [
            {
                letter: "a",
                correct: false,
                within: false,
            },
            {
                letter: "s",
                correct: false,
                within: true,
            },
            {
                letter: "d",
                correct: true,
                within: false,
            },
            {
                letter: "f",
                correct: false,
                within: false,
            },
            {
                letter: "g",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("asdfg", "codes");
        result.results.forEach((entry, i) => {
            assertEntry(entry, expected[i], i);
        });
    });
});
