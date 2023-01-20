#!/usr/bin/env node
const { initGame, submitWord, getErrorMessage } = require("./src/game");
const fs = require("fs");
const readline = require("readline");
const { stdin: input, stdout: output } = require("process");
const { generateShareText } = require("./src/share");
const { STARTING_LIVES } = require("./src/consts");
const { getCountdownString, getNextDate } = require("./src/datetime");
const { version } = require("./package");
const { loadPreferences, savePreferences } = require("./src/storage/cli");

const rl = readline.createInterface({
    input,
    output,
});
const difficultyFlags = ["--hard", "--easy"];

let gameState;
let isWinner = false;
let hardMode = false;
let day;
let lastSubmission;
let preferences;

// https://stackoverflow.com/a/41407246
FgBlack = "\x1b[30m";
FgRed = "\x1b[31m";
FgWhite = "\x1b[37m";

BgBlack = "\x1b[40m";
BgGreen = "\x1b[42m";
BgYellow = "\x1b[43m";

ResetColour = "\x1b[0m";

const getColouredLetter = (letter, colour) => {
    let colourFmt;
    switch (colour) {
        case "yellow":
            colourFmt = `${BgYellow}${FgBlack}`;
            break;
        case "green":
            colourFmt = `${BgGreen}${FgBlack}`;
            break;
        default:
            colourFmt = `${BgBlack}${FgWhite}`;
    }
    return `${colourFmt}${letter}${ResetColour}`;
};

const renderState = (gameState) => {
    for (let i = 0; i < 6; i++) {
        if (i < gameState.attempts.length) {
            console.log(
                gameState.attempts[i]
                    .map((entry) =>
                        entry.correct
                            ? getColouredLetter(entry.letter, "green")
                            : entry.within
                            ? getColouredLetter(entry.letter, "yellow")
                            : getColouredLetter(entry.letter, "grey")
                    )
                    .join("")
            );
        } else {
            console.log("_____");
        }
    }
};

const eventHandler = (event, data) => {
    switch (event) {
        case "init":
            gameState = data.gameState;
            day = data.day;
            break;
        case "first_time":
            console.log(
                "How to play: Guess a five-letter word. Green letters mean they are in the correct place. Yellow letters mean that the letter is in the word but in the wrong place. Grey means that the letter is not in the word. You have six attempts. Good luck!"
            );
            break;
        case "draw":
            renderState(gameState);
            break;
        case "error":
            return console.log(getErrorMessage(data, lastSubmission));
        case "lose":
            return console.log("Game over, word was ", data);
        case "win":
            isWinner = true;
            return console.log("You win!");
    }
};

const prompt = async (message = "> ") => {
    // Workaround for prompt printing before the game text
    await new Promise((resolve) => setTimeout(resolve, 10));
    return new Promise((resolve) => {
        rl.question(message, resolve);
    });
};

const runGame = async () => {
    // Initialize game
    await initGame(eventHandler);
    // Load preferences
    preferences = loadPreferences();
    hardMode = preferences.hardMode;
    // Load difficulty setting from CLI args, otherwise uses the difficulty from preferences
    const mode = process.argv[2];
    if (mode) {
        if (!difficultyFlags.includes(mode)) {
            console.error("Not a valid difficulty (--hard|--easy)");
        } else if (!hardMode && gameState.attempts.length > 0) {
            console.error("Cannot switch difficulty while game is in progress");
        } else {
            hardMode = mode === "--hard";
            savePreferences({
                hardMode,
            });
            if (hardMode) {
                console.log("hard mode enabled");
            } else {
                console.log("easy mode enabled");
            }
        }
    }
    while (!gameState.ended) {
        const answer = await prompt();
        if (answer === "quit" || answer === "q" || answer === "exit") {
            console.log("Bye!");
            return;
        }
        lastSubmission = answer;
        submitWord(
            gameState,
            answer,
            hardMode && gameState.attempts.length > 0
                ? gameState.attempts[gameState.attempts.length - 1]
                : null
        );
    }
    if (isWinner) {
        const answer = await prompt("Would you like to share your results? [Y/n]");
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            import("clipboardy").then((clipboard) => {
                clipboard.default.writeSync(
                    generateShareText(day, gameState.attempts, STARTING_LIVES)
                );
                console.log("Copied to clipboard");
            });
        }
    }
    console.log(`Next Wordle: ${getCountdownString(getNextDate())}`);
};

console.log("wordle-clone", `v${version}`);
runGame().finally(() => rl.close());
