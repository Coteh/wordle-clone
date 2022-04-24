const linkEntryToLetterMap = (letterMap) => (entry) => {
    const currEntry = letterMap.get(entry.letter);
    if (entry.correct) {
        return letterMap.set(entry.letter, "correct");
    }
    if (entry.within && currEntry !== "correct") {
        return letterMap.set(entry.letter, "within");
    }
    if (currEntry !== "correct" && currEntry !== "within") letterMap.set(entry.letter, "incorrect");
};

const getLetterColour = (attempt, letterIndex) =>
    attempt[letterIndex]
        ? attempt[letterIndex].correct
            ? CORRECT_COLOR
            : attempt[letterIndex].within
            ? WITHIN_COLOR
            : INCORRECT_COLOR
        : STANDARD_COLOR;

const updateCountdown = (countdownElem, nextDate) => {
    countdownElem.innerText = getCountdownString(nextDate);
};

document.addEventListener("DOMContentLoaded", async () => {
    const middleElem = document.querySelector("#middle");
    const bottomElem = document.querySelector("#bottom");
    const input = document.querySelector("input[name='word']");

    let currentLetterIndex = 0;
    let inputRowElems = [];
    let currentInputElem;
    let currentInput = "";
    for (let i = 0; i < 6; i++) {
        inputRowElems.push(renderInputRow(middleElem, 5));
    }

    let gameState;
    let day;
    let gameLoaded = false;

    const wordleRenderer = {
        renderInitialState(attempts) {
            attempts.forEach((attempt, index) => {
                console.log(index);
                for (let i = 0; i < 5; i++) {
                    console.log(
                        inputRowElems[index].querySelector(`div:nth-child(${i + 1})`),
                        attempt[i]
                    );
                    inputRowElems[index].querySelector(`div:nth-child(${i + 1}) > span`).innerText =
                        attempt[i].letter;
                    inputRowElems[index].querySelector(
                        `div:nth-child(${i + 1})`
                    ).style.backgroundColor = getLetterColour(attempt, i);
                }
                attempt.forEach((entry) => linkEntryToLetterMap(letterMap)(entry));
            });
            currentInputElem = inputRowElems[attempts.length];
            renderKeyboard(bottomElem, letterMap, handleKeyInput);
        },
        renderCheckResults(results) {
            for (let i = 0; i < 5; i++) {
                console.log(
                    document.querySelector(`#current-input > div:nth-child(${i + 1})`),
                    results[i]
                );
                document.querySelector(
                    `#current-input > div:nth-child(${i + 1})`
                ).style.backgroundColor = getLetterColour(results, i);
            }
            results.forEach((entry) => linkEntryToLetterMap(letterMap)(entry));
            renderKeyboard(bottomElem, letterMap, handleKeyInput);
        },
        renderCheckError(errorID) {
            renderNotification(getErrorMessage(errorID));
        },
        renderWin() {
            const winElem = createDialogContentFromTemplate("#win-dialog-content");
            winElem.querySelector(".share-button").addEventListener("click", (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES);
                console.log(shareText);
                copyShareText(shareText);
            });
            const nextDate = getNextDate();
            updateCountdown(winElem.querySelector(".countdown"), nextDate);
            setInterval(
                () => updateCountdown(document.querySelector(".countdown"), nextDate),
                1000
            );
            renderDialog(winElem, true);
        },
        renderGameOver(word) {
            const loseElem = createDialogContentFromTemplate("#lose-dialog-content");
            loseElem.querySelector("#word").innerText = word;
            const nextDate = getNextDate();
            updateCountdown(loseElem.querySelector(".countdown"), nextDate);
            setInterval(
                () => updateCountdown(document.querySelector(".countdown"), nextDate),
                1000
            );
            renderDialog(loseElem, true);
        },
        renderInput(key) {
            document.querySelector(
                `#current-input > div:nth-child(${currentLetterIndex++ + 1}) > span`
            ).innerText = key.toLowerCase();
        },
        renderBackspace() {
            document.querySelector(
                `#current-input > div:nth-child(${--currentLetterIndex + 1}) > span`
            ).innerText = "";
        },
        renderLifeDecrease(lives) {
            console.log(lives);
            currentInputElem.id = "";
            currentInputElem = inputRowElems[6 - lives];
            currentInputElem.id = "current-input";
            currentLetterIndex = 0;
            currentInput = "";
        },
        renderDayText(day) {
            document.querySelector(".day-text").innerText = `Day ${day + 1}`;
        },
    };

    const eventHandler = (event, data) => {
        switch (event) {
            case "init":
                gameState = data.gameState;
                wordleRenderer.renderInitialState(gameState.attempts);
                currentInputElem = document.querySelector(
                    `#middle > div:nth-child(${STARTING_LIVES - gameState.lives + 1})`
                );
                if (currentInputElem) currentInputElem.id = "current-input";
                day = data.day;
                wordleRenderer.renderDayText(day);
                break;
            case "first_time":
                renderDialog(createDialogContentFromTemplate("#how-to-play"), true);
                break;
            case "draw":
                if (!gameLoaded || gameState.attempts.length <= 0) return;
                wordleRenderer.renderCheckResults(
                    gameState.attempts[gameState.attempts.length - 1]
                );
                break;
            case "error":
                return wordleRenderer.renderCheckError(data);
            case "lose":
                return wordleRenderer.renderGameOver(data);
            case "lose_life":
                return wordleRenderer.renderLifeDecrease(gameState.lives);
            case "win":
                return wordleRenderer.renderWin();
        }
    };

    const handleKeyInput = (key) => {
        if (gameState.ended) {
            return;
        }
        if (key === "enter") {
            submitWord(gameState, currentInput);
        } else if (key.length === 1 && key >= "a" && key <= "z" && currentLetterIndex < 5) {
            wordleRenderer.renderInput(key);
            currentInput = currentInput + key.toLowerCase();
        } else if (key === "backspace" && currentLetterIndex > 0) {
            wordleRenderer.renderBackspace();
            currentInput = currentInput.slice(0, -1);
        }
    };

    window.addEventListener("keydown", (e) => {
        handleKeyInput(e.key.toLowerCase());
    });

    const helpLink = document.querySelector(".help-link");
    helpLink.addEventListener("click", (e) => {
        e.preventDefault();
        renderDialog(createDialogContentFromTemplate("#how-to-play"), true);
    });

    await initGame(eventHandler);

    gameLoaded = true;
});
