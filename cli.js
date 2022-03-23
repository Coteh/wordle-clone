#!/usr/bin/env node
const { initGame, submitWord, getErrorMessage } = require("./src/game");
const fs = require("fs");
const readline = require("readline");
const { stdin: input, stdout: output } = require("process");
const { generateShareText } = require("./src/share");
const { STARTING_LIVES } = require("./src/consts");

const rl = readline.createInterface({
    input,
    output,
});

let gameState;
let isWinner = false;
let day;
let lastSubmission;

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
    await initGame(eventHandler);
    while (!gameState.ended) {
        const answer = await prompt();
        if (answer === "quit" || answer === "q" || answer === "exit") {
            console.log("Bye!");
            return;
        }
        lastSubmission = answer;
        submitWord(gameState, answer);
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
};

runGame().finally(() => rl.close());
