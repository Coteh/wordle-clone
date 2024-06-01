#!/usr/bin/env node
const { initGame, submitWord, getErrorMessage } = require("./src/game");
const fs = require("fs");
const readline = require("readline");
const { stdin: input, stdout: output } = require("process");
const { generateShareText } = require("./src/share");
const { STARTING_LIVES } = require("./src/consts");
const { getCountdownString, getNextDate } = require("./src/datetime");
const { version } = require("./package");
const { loadPreferences, savePreferences, STATE_JSON_FILENAME, PREFERENCES_JSON_FILENAME } = require("./src/storage/cli");

const rl = readline.createInterface({
    input,
    output,
});
const validDifficulties = ["hard", "easy"];

const { program, Option } = require("commander");

program
    .name("wordle-clone")
    .description("A clone of Wordle for the command line")
    .version(version, "-V, --version")
    .option("-v, --verbose", "print extra information")
    .addOption(new Option("-d, --difficulty <string>", "change game difficulty").choices(validDifficulties))
    .action(() => {});
    
program.command("data")
    .description("outputs the filepath of game state and/or preferences")
    .option("-p, --preferences", "output preferences filepath")
    .option("-s, --state", "output game state filepath")
    .action((options) => {
        if (!options.preferences && !options.state) {
            console.error("Please specify a file to print (see --help for flags)");
            process.exit(1);
        }
        if (options.preferences) {
            console.log(PREFERENCES_JSON_FILENAME)
        }
        if (options.state) {
            console.log(STATE_JSON_FILENAME);
        }
        process.exit(0);
    });

let gameState;
let isWinner = false;
let hardMode = false;
let isVerbose = false;
let highContrast = false;
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
BgMagenta = "\x1b[45m";
BgCyan = "\x1b[46m";

ResetColour = "\x1b[0m";

const getColouredLetter = (letter, colour) => {
    let colourFmt;
    switch (colour) {
        case "within":
            colourFmt = (highContrast) ? `${BgCyan}${FgBlack}` : `${BgYellow}${FgBlack}`;
            break;
        case "correct":
            colourFmt = (highContrast) ? `${BgMagenta}${FgBlack}` : `${BgGreen}${FgBlack}`;
            break;
        default:
            colourFmt = `${BgBlack}${FgWhite}`;
    }
    return `${colourFmt}${letter}${ResetColour}`;
};

const getHowToPlayText = () => {
    const correctGuess = [
        getColouredLetter("c","correct"),
        getColouredLetter("l","standard"),
        getColouredLetter("o","standard"),
        getColouredLetter("n","standard"),
        getColouredLetter("e","standard"),
    ].join("");
    const withinGuess = [
        getColouredLetter("s","standard"),
        getColouredLetter("p","within"),
        getColouredLetter("i","standard"),
        getColouredLetter("c","standard"),
        getColouredLetter("e","standard"),
    ].join("");
    const incorrectGuess = [
        getColouredLetter("h","standard"),
        getColouredLetter("e","standard"),
        getColouredLetter("a","standard"),
        getColouredLetter("r","incorrect"),
        getColouredLetter("t","standard"),
    ].join("");
    return `How to play:
Guess a five-letter word in six tries.\n
${correctGuess}
The letter C is in the correct place.\n
${withinGuess}
The letter P is in the word but in the wrong place.\n
${incorrectGuess}
The letter R is not in the word in any place.\n
Good luck!`;
};

const renderState = (gameState) => {
    for (let i = 0; i < 6; i++) {
        if (i < gameState.attempts.length) {
            console.log(
                gameState.attempts[i]
                    .map((entry) =>
                        entry.correct
                            ? getColouredLetter(entry.letter, "correct")
                            : entry.within
                            ? getColouredLetter(entry.letter, "within")
                            : getColouredLetter(entry.letter, "incorrect")
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
                getHowToPlayText()
            );
            break;
        case "draw":
            renderState(gameState);
            break;
        case "error":
            return console.log(getErrorMessage(data, lastSubmission));
        case "lose":
            return console.log("Game over, word was", data);
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

const handleCLIArguments = () => {
    const options = program.opts();
    isVerbose = options.verbose;
    if (isVerbose) {
        console.log("CLI arguments:", options);
    }
    if (options.difficulty) {
        if (!hardMode && gameState.attempts.length > 0 && !gameState.ended) {
            console.error("Cannot switch difficulty while game is in progress");
            process.exit(2);
        }
        hardMode = options.difficulty === "hard";
        savePreferences({
            hardMode,
            highContrast,
        });
        if (hardMode) {
            console.log("hard mode enabled");
        } else {
            console.log("easy mode enabled");
        }
    }
};

const runGame = async () => {
    // Process arguments
    program.parse();
    // Load preferences
    preferences = loadPreferences();
    // Use hard mode setting from preferences first, then CLI can change it if argument is specified
    hardMode = preferences.hardMode;
    highContrast = preferences.highContrast;
    // Initialize game
    await initGame(eventHandler);
    // Process CLI arguments here, as we need to check current game state to see if they can switch to hard mode
    handleCLIArguments();
    if (isVerbose) {
        console.log("State json:", STATE_JSON_FILENAME);
        console.log("Preferences json:", PREFERENCES_JSON_FILENAME);
        console.log("Loaded preferences:", preferences);
    }
    while (!gameState.ended) {
        const answer = await prompt();
        if (answer === "quit" || answer === "q" || answer === "exit") {
            console.log("Bye!");
            return;
        } else if (answer === "help" || answer === "h") {
            console.log(
                getHowToPlayText()
            );
        } else {
            lastSubmission = answer;
            submitWord(
                gameState,
                answer,
                hardMode && gameState.attempts.length > 0
                    ? gameState.attempts[gameState.attempts.length - 1]
                    : null,
                hardMode
            );
        }
    }
    if (isWinner) {
        const answer = await prompt("Would you like to share your results? [Y/n]");
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            import("clipboardy").then((clipboard) => {
                clipboard.default.writeSync(
                    generateShareText(day, gameState.attempts, STARTING_LIVES, {
                        hardMode: gameState.wonHardMode,
                        highContrastMode: highContrast,
                    })
                );
                console.log("Copied to clipboard");
            });
        }
    }
    console.log(`Next Wordle: ${getCountdownString(getNextDate())}`);
};

runGame().finally(() => rl.close());
