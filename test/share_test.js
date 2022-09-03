const { generateShareText } = require("../src/share");
const assert = require("assert");

const ATTEMPTS = [
    [
        {
            letter: "f",
            correct: false,
            within: false,
        },
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
            letter: "s",
            correct: false,
            within: false,
        },
        {
            letter: "e",
            correct: false,
            within: false,
        },
    ],
    [
        {
            letter: "b",
            correct: false,
            within: false,
        },
        {
            letter: "l",
            correct: false,
            within: true,
        },
        {
            letter: "a",
            correct: false,
            within: true,
        },
        {
            letter: "s",
            correct: false,
            within: false,
        },
        {
            letter: "t",
            correct: false,
            within: true,
        },
    ],
    [
        {
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "t",
            correct: false,
            within: true,
        },
        {
            letter: "l",
            correct: false,
            within: true,
        },
        {
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "s",
            correct: false,
            within: false,
        },
    ],
    [
        {
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "l",
            correct: false,
            within: true,
        },
        {
            letter: "t",
            correct: true,
            within: false,
        },
        {
            letter: "a",
            correct: true,
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
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "n",
            correct: true,
            within: false,
        },
        {
            letter: "t",
            correct: true,
            within: false,
        },
        {
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "l",
            correct: true,
            within: false,
        },
    ],
];

describe("share result", () => {
    it("should generate share text", () => {
        const expected = `Wordle Clone 1 5/6
⬛🟨🟨⬛⬛
⬛🟨🟨⬛🟨
🟩🟨🟨🟩⬛
🟩🟨🟩🟩⬛
🟩🟩🟩🟩🟩`;
        assert.strictEqual(generateShareText(1, ATTEMPTS, 6), expected);
    });
    it("should generate share text for high contrast mode", () => {
        const expected = `Wordle Clone 1 5/6
⬛🟦🟦⬛⬛
⬛🟦🟦⬛🟦
🟧🟦🟦🟧⬛
🟧🟦🟧🟧⬛
🟧🟧🟧🟧🟧`;
        assert.strictEqual(
            generateShareText(1, ATTEMPTS, 6, {
                highContrastMode: true,
            }),
            expected
        );
    });
});
