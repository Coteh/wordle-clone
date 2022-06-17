let fs;
let debugEnabled;
if (typeof process !== "undefined") {
    fs = require("fs");

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
const USER_RAN_OUT_OF_LIVES = "UserRanOutOfLives";
const GAME_IS_OVER = "GameIsOver";

class WordListFetchError extends Error {
    constructor(e) {
        super(e);
        this.name = "WordListFetchError";
    }
}

const getErrorMessage = (errorID, userInput) => {
    switch (errorID) {
        case WORDS_DIFFERENT_LENGTH_ERROR_ID:
            if (userInput && userInput.length > 5) {
                return "Too many letters";
            } else {
                return "Not enough letters";
            }
        case NOT_IN_WORD_LIST_ERROR_ID:
            return "Not in word list";
        case USER_INPUT_NOT_PROVIDED_ERROR_ID:
            return "User input not provided";
        case WORD_NOT_PROVIDED_ERROR_ID:
            return "Word not provided to check against (this should not happen, post an issue on GitHub)";
        case USER_RAN_OUT_OF_LIVES:
            return "User ran out of lives";
        case GAME_IS_OVER:
            return "Game is over";
    }
};

let gameState = {};
let wordList = [];
let letterMap = new Map();
let word = "";
let eventHandler = () => {};

const newState = () => {
    return {
        lives: STARTING_LIVES,
        attempts: [],
        ended: false,
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
        const wordListResp = fs.readFileSync("words.txt");
        return wordListResp.toString().trimEnd().split("\n");
    }
    const wordListResp = await fetch("words.txt");
    if (wordListResp.status !== 200) {
        throw new Error("Word list not found");
    }
    const text = await wordListResp.text();
    return text.trimEnd().split("\n");
};

const getWord = async (day, wordList) => {
    if (day < 0 || day >= wordList.length) {
        throw new Error("Day index out of bounds");
    }
    return wordList[day];
};

const checkForWord = (userInput, word, wordList) => {
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

    const day = getCurrentDay() % wordList.length;
    word = await getWord(day, wordList);

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

const submitWord = (gameState, currentInput) => {
    if (gameState.lives <= 0) {
        return eventHandler("error", USER_RAN_OUT_OF_LIVES);
    }
    if (gameState.ended) {
        return eventHandler("error", GAME_IS_OVER);
    }
    const result = checkForWord(currentInput, word, wordList);
    if (result.error) {
        return eventHandler("error", result.error);
    }
    gameState.attempts = [...gameState.attempts, result.results];
    eventHandler("draw");
    if (result.results.every((entry) => entry.correct)) {
        eventHandler("win");
        gameState.ended = true;
    } else {
        gameState.lives--;
        if (gameState.lives === 0) {
            eventHandler("lose", word);
            gameState.ended = true;
        } else {
            eventHandler("lose_life");
        }
    }
    saveGame(gameState.attempts, gameState.lives, gameState.ended);
};

if (typeof process !== "undefined") {
    module.exports = {
        checkForWord,
        getWord,
        initGame,
        submitWord,
        getErrorMessage,
        WORDS_DIFFERENT_LENGTH_ERROR_ID,
        NOT_IN_WORD_LIST_ERROR_ID,
        USER_INPUT_NOT_PROVIDED_ERROR_ID,
        WORD_NOT_PROVIDED_ERROR_ID,
    };
}
