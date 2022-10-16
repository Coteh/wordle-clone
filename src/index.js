const LIGHT_MODE = "light";
const DARK_MODE = "dark";
const HIGH_CONTRAST = "high-contrast";

const THEME_PREFERENCE_NAME = "theme";
const HIGH_CONTRAST_PREFERENCE_NAME = "high-contrast";

const LIGHT_THEME_SETTING_NAME = "light-theme";
const HIGH_CONTRAST_SETTING_NAME = "high-contrast";

const SETTING_ENABLED = "enabled";
const SETTING_DISABLED = "disabled";

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

const getLetterColourClass = (attempt, letterIndex) =>
    attempt[letterIndex]
        ? attempt[letterIndex].correct
            ? "correct"
            : attempt[letterIndex].within
            ? "within"
            : "incorrect"
        : "standard";

const updateCountdown = (countdownElem, nextDate) => {
    countdownElem.innerText = getCountdownString(nextDate);
};

const setCountdownInterval = (nextDate) => {
    setInterval(() => {
        const nextDateElem = document.querySelector(".countdown");
        if (!nextDateElem) return;
        updateCountdown(nextDateElem, nextDate);
    }, 1000);
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
                for (let i = 0; i < 5; i++) {
                    inputRowElems[index].querySelector(`div:nth-child(${i + 1}) > span`).innerText =
                        attempt[i].letter;
                    inputRowElems[index].querySelector(
                        `div:nth-child(${i + 1})`
                    ).className = `box ${getLetterColourClass(attempt, i)}`;
                }
                attempt.forEach((entry) => linkEntryToLetterMap(letterMap)(entry));
            });
            currentInputElem = inputRowElems[attempts.length];
            renderKeyboard(bottomElem, letterMap, handleKeyInput, handleHoldInput, gameState);
        },
        renderCheckResults(results) {
            for (let i = 0; i < 5; i++) {
                document.querySelector(
                    `#current-input > div:nth-child(${i + 1})`
                ).className = `box ${getLetterColourClass(results, i)}`;
            }
            results.forEach((entry) => linkEntryToLetterMap(letterMap)(entry));
            renderKeyboard(bottomElem, letterMap, handleKeyInput, handleHoldInput, gameState);
        },
        renderCheckError(errorID) {
            renderNotification(getErrorMessage(errorID));
        },
        renderWin() {
            const winElem = createDialogContentFromTemplate("#win-dialog-content");
            winElem.querySelector(".share-button").addEventListener("click", (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES, {
                    highContrastMode,
                });
                copyShareText(shareText);
            });
            const nextDate = getNextDate();
            updateCountdown(winElem.querySelector(".countdown"), nextDate);
            setCountdownInterval(nextDate);
            renderDialog(winElem, true);
        },
        renderGameOver(word) {
            const loseElem = createDialogContentFromTemplate("#lose-dialog-content");
            loseElem.querySelector("#word").innerText = word;
            const nextDate = getNextDate();
            updateCountdown(loseElem.querySelector(".countdown"), nextDate);
            setCountdownInterval(nextDate);
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
            currentInputElem.id = "";
            currentInputElem = inputRowElems[6 - lives];
            currentInputElem.id = "current-input";
            currentLetterIndex = 0;
            currentInput = "";
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
                document.querySelector(".day-number").innerText = `Day #${day}`;
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

    const closeDialog = (dialog, overlayBackElem) => {
        if (dialog) {
            // Check if dialog is closable first before closing (close button would be visible, if so)
            const closeBtn = dialog.querySelector("button.close");
            if (closeBtn.style.display === "none") {
                return;
            }
            dialog.remove();
        }
        // NTS: Perhaps it'd make more sense if overlay backdrop only disappeared when a valid dialog is passed,
        // but if an invalid dialog is being passed, it might not be on the screen either.
        // In this case, it may be better to leave this as-is and always have the backdrop close so that players can still play.
        overlayBackElem.style.display = "none";
    };

    const handleKeyInput = (key) => {
        const dialog = document.querySelector(".dialog");
        if (dialog && (key === "enter" || key === "escape")) {
            return closeDialog(dialog, overlayBackElem);
        }
        if (dialog || gameState.ended) {
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

    const handleHoldInput = (key) => {
        if (gameState.ended) return;
        if (key === "backspace") {
            for (let i = 0; i < currentInput.length; i++) {
                wordleRenderer.renderBackspace();
            }
            currentInput = "";
        }
    };

    window.addEventListener("keydown", (e) => {
        handleKeyInput(e.key.toLowerCase());
    });

    const helpLink = document.querySelector(".help-link");
    helpLink.addEventListener("click", (e) => {
        e.preventDefault();
        renderDialog(createDialogContentFromTemplate("#how-to-play"), true);
        helpLink.blur();
    });

    const gamePane = document.querySelector(".game");
    const settingsPane = document.querySelector(".settings");
    const settingsLink = document.querySelector(".settings-link");

    const toggleSettings = () => {
        settingsLink.blur();
        if (settingsPane.style.display === "none") {
            gamePane.style.display = "none";
            settingsPane.style.display = "flex";
        } else {
            gamePane.style.display = "flex";
            settingsPane.style.display = "none";
        }
    };

    settingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSettings();
    });

    const settingsClose = settingsPane.querySelector(".close");
    settingsClose.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSettings();
    });

    const overlayBackElem = document.querySelector(".overlay-back");
    overlayBackElem.addEventListener("click", (e) => {
        const dialog = document.querySelector(".dialog");
        closeDialog(dialog, overlayBackElem);
    });

    let lightMode = false;
    let highContrastMode = false;

    const settings = document.querySelectorAll(".setting");
    settings.forEach((setting) => {
        setting.addEventListener("click", (e) => {
            const elem = e.target;
            let enabled = false;
            if (elem.classList.contains(LIGHT_THEME_SETTING_NAME)) {
                enabled = lightMode = !lightMode;
                metaThemeColor = document.querySelector("meta[name='theme-color']");
                if (lightMode) {
                    document.body.classList.add(LIGHT_MODE);
                    metaThemeColor.content = "#fff";
                } else {
                    document.body.classList.remove(LIGHT_MODE);
                    metaThemeColor.content = "#000";
                }
                savePreferenceValue(THEME_PREFERENCE_NAME, lightMode ? LIGHT_MODE : DARK_MODE);
            } else if (elem.classList.contains(HIGH_CONTRAST_SETTING_NAME)) {
                enabled = highContrastMode = !highContrastMode;
                if (highContrastMode) {
                    document.body.classList.add(HIGH_CONTRAST);
                } else {
                    document.body.classList.remove(HIGH_CONTRAST);
                }
                savePreferenceValue(
                    HIGH_CONTRAST_PREFERENCE_NAME,
                    highContrastMode ? SETTING_ENABLED : SETTING_DISABLED
                );
            }
            const toggle = setting.querySelector(".toggle");
            toggle.innerText = enabled ? "ON" : "OFF";
        });
    });

    initPreferences();
    if (getPreferenceValue(THEME_PREFERENCE_NAME) === LIGHT_MODE) {
        lightMode = true;
        const setting = document.querySelector(".setting.light-theme");
        const toggle = setting.querySelector(".toggle");
        toggle.innerText = "ON";
        document.body.classList.add(LIGHT_MODE);
        document.querySelector("meta[name='theme-color']").content = "#fff";
    }
    if (getPreferenceValue(HIGH_CONTRAST_PREFERENCE_NAME) === SETTING_ENABLED) {
        highContrastMode = true;
        const setting = document.querySelector(".setting.high-contrast");
        const toggle = setting.querySelector(".toggle");
        toggle.innerText = "ON";
        document.body.classList.add(HIGH_CONTRAST);
    }

    try {
        await initGame(eventHandler);
    } catch (e) {
        if (typeof Sentry !== "undefined") Sentry.captureException(e);
        const elem = createDialogContentFromTemplate("#error-dialog-content");
        const errorContent = elem.querySelector(".error-text");
        if (e instanceof WordListFetchError) {
            errorContent.innerText = "Could not fetch word list.";
        } else {
            console.error("Unknown error occurred", e);
            errorContent.innerText = e.message;
        }
        renderDialog(elem, true, false);
    }

    gameLoaded = true;
});
