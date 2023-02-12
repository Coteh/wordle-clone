const {
    checkForWord,
    getWord,
    WORDS_DIFFERENT_LENGTH_ERROR_ID,
    NOT_IN_WORD_LIST_ERROR_ID,
    WORD_NOT_PROVIDED_ERROR_ID,
    USER_INPUT_NOT_PROVIDED_ERROR_ID,
    PREV_STATE_NOT_MATCHING_ERROR_ID,
    getPositionWord,
    getHardModeErrorMessage,
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

const wordList = [
    ...fs.readFileSync("words.txt").toString("utf-8").trimEnd().split("\n"),
    "solos",
    "tests",
];

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

describe("hard mode", () => {
    it("should fail word check if it doesn't match previous state, if one is passed in", () => {
        const previous = [
            {
                letter: "g",
                correct: false,
                within: false,
            },
            {
                letter: "r",
                correct: false,
                within: true,
            },
            {
                letter: "a",
                correct: false,
                within: false,
            },
            {
                letter: "i",
                correct: false,
                within: false,
            },
            {
                letter: "n",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("total", "robot", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "r",
        });
    });

    it("should report the position of a letter if it was correct previously but not correct anymore", () => {
        const previous = [
            {
                letter: "c",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: true,
                within: true,
            },
            {
                letter: "d",
                correct: false,
                within: false,
            },
            {
                letter: "e",
                correct: false,
                within: false,
            },
            {
                letter: "c",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("clone", "robot", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "o",
            position: 1,
        });
    });

    it("should report the position of a missing letter if it was correct in one place previously, but still correct in another spot in the next attempt", () => {
        const previous = [
            {
                letter: "g",
                correct: false,
                within: false,
            },
            {
                letter: "h",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: true,
                within: true,
            },
            {
                letter: "s",
                correct: false,
                within: true,
            },
            {
                letter: "t",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("solos", "swoop", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "o",
            position: 2,
        });
    });

    it("should report the position of a missing letter if it was correct in one place previously, but not present in the next attempt", () => {
        const previous = [
            {
                letter: "g",
                correct: false,
                within: false,
            },
            {
                letter: "h",
                correct: false,
                within: false,
            },
            {
                letter: "o",
                correct: true,
                within: true,
            },
            {
                letter: "s",
                correct: false,
                within: true,
            },
            {
                letter: "t",
                correct: false,
                within: false,
            },
        ];
        const result = checkForWord("start", "swoop", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "o",
            position: 2,
        });
    });

    it("should report that a letter should be present, even if another instance of that letter is before it in the word and in the correct place", () => {
        const previous = [
            {
                letter: "f",
                correct: false,
                within: false,
            },
            {
                letter: "l",
                correct: true,
                within: true,
            },
            {
                letter: "a",
                correct: true,
                within: true,
            },
            {
                letter: "i",
                correct: false,
                within: false,
            },
            {
                letter: "l",
                correct: false,
                within: true,
            },
        ];
        const result = checkForWord("slate", "llama", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "l",
        });
    });

    it("should report that a letter should be present, even if another instance of that letter is after it in the word and in the correct place", () => {
        const previous = [
            {
                letter: "s",
                correct: false,
                within: true,
            },
            {
                letter: "e",
                correct: false,
                within: false,
            },
            {
                letter: "e",
                correct: false,
                within: false,
            },
            {
                letter: "r",
                correct: false,
                within: false,
            },
            {
                letter: "s",
                correct: true,
                within: true,
            },
        ];
        const result = checkForWord("desks", "floss", wordList, previous);
        assert(result.error === PREV_STATE_NOT_MATCHING_ERROR_ID);
        assert.deepEqual(result.expected, {
            letter: "s",
        });
    });

    describe("getPositionWord", () => {
        it("should generate texts for each of the word positions", () => {
            assert.deepEqual(
                new Array(5).fill(0).map((_, i) => getPositionWord(i)),
                ["first", "second", "third", "fourth", "fifth"]
            );
        });
        it("should generate fallback texts for values out of expected range", () => {
            assert.deepEqual(
                [-1, 6, 100, "a string", NaN, undefined, null].map((v) => getPositionWord(v)),
                ["-1", "6", "100", "a string", "NaN", "undefined", "undefined"]
            );
        });
    });

    describe("getHardModeErrorMessage", () => {
        it("should generate a message for within misses", () => {
            assert.strictEqual(
                getHardModeErrorMessage({
                    letter: "o",
                }),
                "Letter 'o' must be present"
            );
        });

        it("should generate a message for correct misses", () => {
            assert.strictEqual(
                getHardModeErrorMessage({
                    letter: "o",
                    position: 2,
                }),
                "Letter 'o' must be in third position"
            );
        });

        it("should generate a message for correct miss if it was in first position", () => {
            assert.strictEqual(
                getHardModeErrorMessage({
                    letter: "o",
                    position: 0,
                }),
                "Letter 'o' must be in first position"
            );
        });
    });
});

describe("get word", () => {
    const wordList = [
        "first",
        "tests",
        "third",
        "fours",
        "fifth",
        "sixth",
        "seven",
        "balls",
        "words",
        "break",
    ];
    it("should get the day's word", async () => {
        assert.strictEqual(await getWord(5, wordList), "sixth");
    });
    it("should handle out of bounds", async () => {
        await assert.rejects(getWord(10, wordList), {
            name: "Error",
            message: "Word list index out of bounds",
        });
        await assert.rejects(getWord(-1, wordList), {
            name: "Error",
            message: "Word list index out of bounds",
        });
    });
});
