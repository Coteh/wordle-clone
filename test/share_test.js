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

const INCOMPLETE_ATTEMPTS = [
    [
        {
            "letter": "t",
            "correct": false,
            "within": true
        },
        {
            "letter": "h",
            "correct": false,
            "within": false
        },
        {
            "letter": "i",
            "correct": false,
            "within": false
        },
        {
            "letter": "n",
            "correct": false,
            "within": false
        },
        {
            "letter": "g",
            "correct": false,
            "within": false
        }
    ],
    [
        {
            "letter": "b",
            "correct": false,
            "within": false
        },
        {
            "letter": "l",
            "correct": false,
            "within": false
        },
        {
            "letter": "u",
            "correct": false,
            "within": false
        },
        {
            "letter": "r",
            "correct": false,
            "within": false
        },
        {
            "letter": "t",
            "correct": true,
            "within": false
        }
    ],
    [
        {
            "letter": "a",
            "correct": false,
            "within": true
        },
        {
            "letter": "d",
            "correct": false,
            "within": false
        },
        {
            "letter": "a",
            "correct": false,
            "within": false
        },
        {
            "letter": "p",
            "correct": false,
            "within": false
        },
        {
            "letter": "t",
            "correct": true,
            "within": false
        }
    ],
    [
        {
            "letter": "t",
            "correct": false,
            "within": false
        },
        {
            "letter": "r",
            "correct": false,
            "within": false
        },
        {
            "letter": "e",
            "correct": false,
            "within": true
        },
        {
            "letter": "a",
            "correct": false,
            "within": true
        },
        {
            "letter": "t",
            "correct": true,
            "within": false
        }
    ],
    [
        {
            "letter": "v",
            "correct": false,
            "within": false
        },
        {
            "letter": "a",
            "correct": true,
            "within": false
        },
        {
            "letter": "l",
            "correct": false,
            "within": false
        },
        {
            "letter": "e",
            "correct": true,
            "within": false
        },
        {
            "letter": "t",
            "correct": true,
            "within": false
        }
    ],
    [
        {
            "letter": "c",
            "correct": false,
            "within": true
        },
        {
            "letter": "a",
            "correct": true,
            "within": false
        },
        {
            "letter": "d",
            "correct": false,
            "within": false
        },
        {
            "letter": "e",
            "correct": true,
            "within": false
        },
        {
            "letter": "t",
            "correct": true,
            "within": false
        }
    ]
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
    it("should generate share text for hard mode", () => {
        const expected = `Wordle Clone 1 5/6*
⬛🟨🟨⬛⬛
⬛🟨🟨⬛🟨
🟩🟨🟨🟩⬛
🟩🟨🟩🟩⬛
🟩🟩🟩🟩🟩`;
        assert.strictEqual(
            generateShareText(1, ATTEMPTS, 6, {
                hardMode: true,
            }),
            expected
        );
    });
    it("should generate share text for both high contrast and hard mode enabled at the same time", () => {
        const expected = `Wordle Clone 1 5/6*
⬛🟦🟦⬛⬛
⬛🟦🟦⬛🟦
🟧🟦🟦🟧⬛
🟧🟦🟧🟧⬛
🟧🟧🟧🟧🟧`;
        assert.strictEqual(
            generateShareText(1, ATTEMPTS, 6, {
                highContrastMode: true,
                hardMode: true,
            }),
            expected
        );
    });
    it("should generate share text for incomplete game", () => {
        const expected = `Wordle Clone 1 X/6
🟨⬛⬛⬛⬛
⬛⬛⬛⬛🟩
🟨⬛⬛⬛🟩
⬛⬛🟨🟨🟩
⬛🟩⬛🟩🟩
🟨🟩⬛🟩🟩`;
        assert.strictEqual(
            generateShareText(1, INCOMPLETE_ATTEMPTS, 6),
            expected
        );
    });
    it("should generate share text for incomplete game with hard mode enabled", () => {
        const expected = `Wordle Clone 1 X/6*
🟨⬛⬛⬛⬛
⬛⬛⬛⬛🟩
🟨⬛⬛⬛🟩
⬛⬛🟨🟨🟩
⬛🟩⬛🟩🟩
🟨🟩⬛🟩🟩`;
        assert.strictEqual(
            generateShareText(1, INCOMPLETE_ATTEMPTS, 6, {
                hardMode: true,
            }),
            expected
        );
    });
    it("should generate share text for incomplete game with high contrast enabled", () => {
        const expected = `Wordle Clone 1 X/6
🟦⬛⬛⬛⬛
⬛⬛⬛⬛🟧
🟦⬛⬛⬛🟧
⬛⬛🟦🟦🟧
⬛🟧⬛🟧🟧
🟦🟧⬛🟧🟧`;
        assert.strictEqual(
            generateShareText(1, INCOMPLETE_ATTEMPTS, 6, {
                highContrastMode: true,
            }),
            expected
        );
    });
    it("should generate share text for incomplete game with hard mode and high contrast enabled at the same time", () => {
        const expected = `Wordle Clone 1 X/6*
🟦⬛⬛⬛⬛
⬛⬛⬛⬛🟧
🟦⬛⬛⬛🟧
⬛⬛🟦🟦🟧
⬛🟧⬛🟧🟧
🟦🟧⬛🟧🟧`;
        assert.strictEqual(
            generateShareText(1, INCOMPLETE_ATTEMPTS, 6, {
                hardMode: true,
                highContrastMode: true,
            }),
            expected
        );
    });
});
