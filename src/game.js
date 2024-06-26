let fs;
let debugEnabled;
if (typeof process !== "undefined") {
    fs = require("fs");
    path = require("path");

    const storage = require("./storage/cli");
    checkGameValidity = storage.checkGameValidity;
    clearGame = storage.clearGame;
    saveGame = storage.saveGame;
    loadGame = storage.loadGame;
    checkFirstTime = storage.checkFirstTime;
    setPlayedBefore = storage.setPlayedBefore;

    const datetime = require("./datetime");
    getCurrentDay = datetime.getCurrentDay;

    STARTING_LIVES = require("./consts").STARTING_LIVES;

    debugEnabled = process.env.DEBUG === "true";
}

const WORDS_DIFFERENT_LENGTH_ERROR_ID = "WordsDifferentLength";
const NOT_IN_WORD_LIST_ERROR_ID = "NotInWordList";
const USER_INPUT_NOT_PROVIDED_ERROR_ID = "UserInputNotProvided";
const WORD_NOT_PROVIDED_ERROR_ID = "WordNotProvided";
const USER_RAN_OUT_OF_LIVES_ERROR_ID = "UserRanOutOfLives";
const GAME_IS_OVER_ERROR_ID = "GameIsOver";
const PREV_STATE_NOT_MATCHING_ERROR_ID = "StateNotMatch";

// March 23 2022 - initial release date
const FIRST_DAY = 19074;

class WordListFetchError extends Error {
    constructor(e) {
        super(e);
        this.name = "WordListFetchError";
    }
}

const getPositionWord = (pos) => {
    switch (pos) {
        case 0:
            return "1st";
        case 1:
            return "2nd";
        case 2:
            return "3rd";
        case 3:
            return "4th";
        case 4:
            return "5th";
        default:
            return pos != null ? pos.toString() : "undefined";
    }
};

const getHardModeErrorMessage = (letterAttempt) => {
    if (letterAttempt.unique == null) {
        letterAttempt.unique = true;
    }
    const anotherText = letterAttempt.unique ? "" : "another ";
    if (letterAttempt.position >= 0) {
        return `${getPositionWord(
            letterAttempt.position
        )} letter must be ${letterAttempt.letter.toUpperCase()}`;
    }
    return `Guess must contain ${anotherText}${letterAttempt.letter.toUpperCase()}`;
};

const getErrorMessage = (error, userInput) => {
    switch (error.error) {
        case WORDS_DIFFERENT_LENGTH_ERROR_ID:
            if (userInput && userInput.length > 5) {
                return "Too many letters";
            } else {
                return "Not enough letters";
            }
        case NOT_IN_WORD_LIST_ERROR_ID:
            return "Not in word list";
        case USER_INPUT_NOT_PROVIDED_ERROR_ID:
            return "Input not provided";
        case WORD_NOT_PROVIDED_ERROR_ID:
            return "Word not provided to check against (this should not happen, post an issue on GitHub)";
        case USER_RAN_OUT_OF_LIVES_ERROR_ID:
            return "User ran out of lives";
        case GAME_IS_OVER_ERROR_ID:
            return "Game is over";
        case PREV_STATE_NOT_MATCHING_ERROR_ID:
            return getHardModeErrorMessage(error.expected);
    }
};

let gameState = {};
let wordList = [];
let word = "";
let eventHandler = () => {};
const currentDay = getCurrentDay();

const newState = () => {
    return {
        lives: STARTING_LIVES,
        attempts: [],
        ended: false,
        wonHardMode: false,
    };
};

const loadState = () => {
    return loadGame();
};

const initState = () => {
    let state;

    if (checkGameValidity()) {
        state = loadState();
    } else {
        clearGame();
        state = newState();
    }

    return state;
};

const loadWordList = async () => {
    // TODO abstract the loading of words into separate struct/method
    if (typeof process !== "undefined") {
        const wordsFilepath = path.join(__dirname, "../words.txt");
        const wordListResp = fs.readFileSync(wordsFilepath);
        return wordListResp.toString().trimEnd().split("\n");
    }
    const wordListResp = await fetch("words.txt");
    if (wordListResp.status !== 200) {
        throw new Error("Word list not found");
    }
    const text = await wordListResp.text();
    return text.trimEnd().split("\n");
};

const getWord = async (wordListIndex, wordList) => {
    if (wordListIndex < 0 || wordListIndex >= wordList.length) {
        throw new Error("Word list index out of bounds");
    }
    return wordList[wordListIndex];
};

const getDayNumber = () => {
    return currentDay - FIRST_DAY;
};

const compareAttempts = (currAttempt, previousAttempt) => {
    // Keep track of which positions are correct, so that they can be exempt from the within check
    const correctPosArr = new Array(previousAttempt.length).fill(0).map((_) => false);
    // First check the letters in previous attempt that were correct
    for (let i = 0; i < previousAttempt.length; i++) {
        const letterAttempt = previousAttempt[i];
        if (letterAttempt.correct) {
            // Check if letter is in the same spot in current attempt
            if (letterAttempt.letter !== currAttempt[i].letter) {
                return {
                    matches: false,
                    expected: {
                        letter: letterAttempt.letter,
                        position: i,
                    },
                };
            }
            correctPosArr[i] = true;
        }
    }
    // Keep a count of the occurrences of each letter in the current guess,
    // so that the error message for withins can account for another instance of that letter already in the guess
    const countsMap = new Map();
    currAttempt.forEach((letterAttempt) => {
        if (!countsMap.get(letterAttempt.letter)) {
            countsMap.set(letterAttempt.letter, 1);
        } else {
            countsMap.set(letterAttempt.letter, countsMap.get(letterAttempt.letter) + 1);
        }
    });
    // Keep track of which positions in current guess are within, so that multiple instances of the same letter from previous guess
    // will not be counted as in the current guess using the same letter from the current guess.
    const withinPosArr = new Array(previousAttempt.length).fill(0).map((_) => false);
    // Now that the letters that were correct are known, check the withins
    for (let i = 0; i < previousAttempt.length; i++) {
        const letterAttempt = previousAttempt[i];
        if (letterAttempt.within && !letterAttempt.correct) {
            // Check if the letter is also within in the current attempt
            let inCurrAttempt = false;
            for (let j = 0; j < currAttempt.length; j++) {
                const currLetterAttempt = currAttempt[j];
                if (
                    letterAttempt.letter === currLetterAttempt.letter &&
                    !correctPosArr[j] &&
                    !withinPosArr[j]
                ) {
                    inCurrAttempt = true;
                    // Once this particular instance of letter is marked as in the attempt, it shouldn't be marked again by any following instances of that letter.
                    withinPosArr[j] = true;
                    break;
                }
            }
            if (!inCurrAttempt) {
                const letterCount = countsMap.get(letterAttempt.letter) || 0;
                return {
                    matches: false,
                    expected: {
                        letter: letterAttempt.letter,
                        unique: letterCount <= 0,
                    },
                };
            }
        }
    }
    return {
        matches: true,
    };
};

const checkForWord = (userInput, word, wordList, previousAttempt) => {
    if (!userInput) {
        return {
            error: USER_INPUT_NOT_PROVIDED_ERROR_ID,
        };
    }

    if (!word) {
        return {
            error: WORD_NOT_PROVIDED_ERROR_ID,
        };
    }

    if (userInput.length !== word.length) {
        return {
            error: WORDS_DIFFERENT_LENGTH_ERROR_ID,
        };
    }

    if (wordList && !wordList.includes(userInput)) {
        return {
            error: NOT_IN_WORD_LIST_ERROR_ID,
        };
    }

    const remaining = new Map();
    word.split("").forEach((letter) => {
        if (!remaining.get(letter)) {
            remaining.set(letter, 1);
        } else {
            remaining.set(letter, remaining.get(letter) + 1);
        }
    });

    userInput.split("").forEach((guessedLetter, i) => {
        if (guessedLetter === word[i]) {
            remaining.set(guessedLetter, remaining.get(guessedLetter) - 1);
        }
    });

    const results = userInput.split("").map((guessedLetter, i) => {
        let isInRemaining = remaining.get(guessedLetter) > 0;
        if (isInRemaining && guessedLetter !== word[i]) {
            remaining.set(guessedLetter, remaining.get(guessedLetter) - 1);
        }
        return {
            letter: guessedLetter,
            correct: guessedLetter === word[i],
            within: isInRemaining,
        };
    });

    // If previous attempt is passed in, perform the hard mode check
    if (previousAttempt) {
        attemptMatchResult = compareAttempts(results, previousAttempt);
        if (!attemptMatchResult.matches) {
            return {
                error: PREV_STATE_NOT_MATCHING_ERROR_ID,
                expected: attemptMatchResult.expected,
            };
        }
    }

    return {
        results,
    };
};

const initGame = async (_eventHandler) => {
    try {
        wordList = await loadWordList();
    } catch (e) {
        throw new WordListFetchError(e);
    }

    if (debugEnabled) console.log(wordList);

    const wordListIndex = currentDay % wordList.length;
    word = await getWord(wordListIndex, wordList);
    const day = getDayNumber();

    gameState = initState();

    eventHandler = _eventHandler;

    eventHandler("init", { gameState, day });

    if (checkFirstTime()) {
        eventHandler("first_time");
        setPlayedBefore(true);
    }

    if (debugEnabled) console.log(gameState);

    eventHandler("draw");

    if (gameState.lives === 0) {
        eventHandler("lose", word);
    } else if (gameState.ended) {
        eventHandler("win");
    }
};

const submitWord = (gameState, currentInput, previousAttempt, hardMode) => {
    if (gameState.lives <= 0) {
        return eventHandler("error", USER_RAN_OUT_OF_LIVES_ERROR_ID);
    }
    if (gameState.ended) {
        return eventHandler("error", GAME_IS_OVER_ERROR_ID);
    }
    const result = checkForWord(currentInput, word, wordList, previousAttempt);
    if (result.error) {
        return eventHandler("error", result);
    }
    gameState.attempts = [...gameState.attempts, result.results];
    eventHandler("draw");
    if (result.results.every((entry) => entry.correct)) {
        eventHandler("win");
        gameState.ended = true;
        // If the player won on hard mode, then the game should still indicate
        // that they won on hard mode, even if they switch difficulty after, and vice versa.
        gameState.wonHardMode = hardMode;
    } else {
        gameState.lives--;
        if (gameState.lives === 0) {
            eventHandler("lose", word);
            gameState.ended = true;
        } else {
            eventHandler("lose_life");
        }
    }
    saveGame(
        gameState.attempts,
        gameState.lives,
        gameState.ended,
        currentDay,
        gameState.wonHardMode
    );
};

if (typeof process !== "undefined") {
    module.exports = {
        checkForWord,
        getWord,
        initGame,
        submitWord,
        getPositionWord,
        getHardModeErrorMessage,
        getErrorMessage,
        WORDS_DIFFERENT_LENGTH_ERROR_ID,
        NOT_IN_WORD_LIST_ERROR_ID,
        USER_INPUT_NOT_PROVIDED_ERROR_ID,
        WORD_NOT_PROVIDED_ERROR_ID,
        PREV_STATE_NOT_MATCHING_ERROR_ID,
    };
}
