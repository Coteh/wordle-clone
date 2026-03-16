const LIGHT_MODE = "light";
const DARK_MODE = "dark";
const SNOW_THEME = "snow";
const QWERTY_KEYBOARD = "qwerty";
const DVORAK_KEYBOARD = "dvorak";
const ALPHABETICAL_KEYBOARD = "alphabetical";
const HIGH_CONTRAST = "high-contrast";

const THEME_PREFERENCE_NAME = "theme";
const HIGH_CONTRAST_PREFERENCE_NAME = "high-contrast";
const HARD_MODE_PREFERENCE_NAME = "hard-mode";
const KEYBOARD_PREFERENCE_NAME = "keyboard";

const SETTING_ENABLED = "enabled";
const SETTING_DISABLED = "disabled";

const LANDSCAPE_CLASS_NAME = "landscape";

const letterMap = new Map();

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

    const selectableThemes = [DARK_MODE, LIGHT_MODE, SNOW_THEME];
    let themeManager = ThemeManager.getInstance();
    themeManager.setSelectableThemes(selectableThemes);

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
            renderKeyboard(bottomElem, letterMap, handleKeyInput, handleHoldInput, gameState, selectedKeyboard);
        },
        renderCheckResults(results) {
            for (let i = 0; i < 5; i++) {
                document.querySelector(
                    `#current-input > div:nth-child(${i + 1})`
                ).className = `box ${getLetterColourClass(results, i)}`;
            }
            results.forEach((entry) => linkEntryToLetterMap(letterMap)(entry));
            renderKeyboard(bottomElem, letterMap, handleKeyInput, handleHoldInput, gameState, selectedKeyboard);
        },
        renderCheckError(error) {
            renderNotification(getErrorMessage(error));
        },
        renderWin() {
            const winElem = createDialogContentFromTemplate("#win-dialog-content");
            const shareButton = winElem.querySelector(".share-button");
            const copyButton = winElem.querySelector(".clipboard-button");
            shareButton.addEventListener("click", async (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES, {
                    highContrastMode,
                    hardMode: gameState.wonHardMode,
                });
                if (!await triggerShare(shareText)) {
                    console.log("Triggering share not successful, swapping out for copy to clipboard button...");
                    copyButton.style.display = "";
                    shareButton.style.display = "none";
                }
            });
            copyButton.addEventListener("click", (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES, {
                    highContrastMode,
                    hardMode: gameState.wonHardMode,
                });
                copyShareText(shareText);
            });
            const nextDate = getNextDate();
            updateCountdown(winElem.querySelector(".countdown"), nextDate);
            setCountdownInterval(nextDate);
            renderDialog(winElem, {
                fadeIn: true,
                closable: true,
            });
        },
        renderGameOver(word) {
            const loseElem = createDialogContentFromTemplate("#lose-dialog-content");
            loseElem.querySelector("#word").innerText = word;
            const shareButton = loseElem.querySelector(".share-button");
            const copyButton = loseElem.querySelector(".clipboard-button")
            shareButton.addEventListener("click", async (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES, {
                    highContrastMode,
                    hardMode,
                });
                if (!await triggerShare(shareText)) {
                    console.log("Triggering share not successful, swapping out for copy to clipboard button...");
                    copyButton.style.display = "";
                    shareButton.style.display = "none";
                }
            });
            copyButton.addEventListener("click", (e) => {
                e.preventDefault();
                const shareText = generateShareText(day, gameState.attempts, STARTING_LIVES, {
                    highContrastMode,
                    hardMode,
                });
                copyShareText(shareText);
            });
            const nextDate = getNextDate();
            updateCountdown(loseElem.querySelector(".countdown"), nextDate);
            setCountdownInterval(nextDate);
            renderDialog(loseElem, {
                fadeIn: true,
                closable: true,
            });
        },
        renderInput(key) {
            const elem = document.querySelector(
                `#current-input > div:nth-child(${currentLetterIndex++ + 1}) > span`
            );
            elem.innerText = key.toLowerCase();
            elem.parentElement.classList.add("filled");
        },
        renderBackspace() {
            const elem = document.querySelector(
                `#current-input > div:nth-child(${--currentLetterIndex + 1}) > span`
            );
            elem.innerText = "";
            elem.parentElement.classList.remove("filled");
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
                renderDialog(createDialogContentFromTemplate("#how-to-play"), {
                    fadeIn: true,
                    closable: true,
                });
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
            dialog.close();
            dialog.remove();
        }
        // NTS: Perhaps it'd make more sense if overlay backdrop only disappeared when a valid dialog is passed,
        // but if an invalid dialog is being passed, it might not be on the screen either.
        // In this case, it may be better to leave this as-is and always have the backdrop close so that players can still play.
        overlayBackElem.style.display = "none";
        // Restore normal theme color when closing dialog
        themeManager.applyNormalThemeColor();
        // Remove focus from any button that might have opened the dialog
        document.activeElement.blur();
    };

    const handleKeyInput = (key, ctrlKey, metaKey) => {
        const dialog = document.querySelector(".dialog");
        if (dialog && key === "escape") {
            return closeDialog(dialog, overlayBackElem);
        }
        if (gamePane.style.display === "none") {
            return;
        }
        if (dialog || gameState.ended || ctrlKey || metaKey) {
            return;
        }
        if (key === "enter") {
            submitWord(
                gameState,
                currentInput,
                hardMode && gameState.attempts.length > 0
                    ? gameState.attempts[gameState.attempts.length - 1]
                    : null,
                hardMode
            );
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
        handleKeyInput(e.key.toLowerCase(), e.ctrlKey, e.metaKey);
    });

    const debugLink = document.querySelector(".debug-link#debug");
    if (debugLink) {
        debugLink.addEventListener("click", (e) => {
            e.preventDefault();
            const debugDialogElem = createDialogContentFromTemplate("#debug-dialog-content");
            const migrationDialogBtn = debugDialogElem.querySelector("button.migrate-dialog");
            migrationDialogBtn.addEventListener("click", () => {
                renderDialog(createDialogContentFromTemplate("#migration-dialog-content"), {
                    fadeIn: true,
                    closable: true,
                });
            });
            renderDialog(debugDialogElem, {
                fadeIn: true,
                closable: true,
            });
            debugLink.blur();
        });
    }

    const helpLink = document.querySelector(".help-link");
    helpLink.addEventListener("click", (e) => {
        e.preventDefault();
        renderDialog(createDialogContentFromTemplate("#how-to-play"), {
            fadeIn: true,
            closable: true,
        });
        helpLink.blur();
    });

    const gamePane = document.querySelector(".game");
    const settingsPane = document.querySelector(".settings");
    const themesPane = document.querySelector(".themes");
    const settingsLink = document.querySelector(".settings-link");

    const showThemesPane = () => {
        settingsPane.style.display = "none";
        themesPane.style.display = "flex";
        updateThemeCardActiveState();
    };

    const hideThemesPane = () => {
        themesPane.style.display = "none";
        settingsPane.style.display = "flex";
    };

    const closeThemesPane = () => {
        themesPane.style.display = "none";
        gamePane.style.display = "flex";
    };

    const toggleSettings = () => {
        settingsLink.blur();
        if (settingsPane.style.display !== "none" || themesPane.style.display !== "none") {
            gamePane.style.display = "flex";
            settingsPane.style.display = "none";
            themesPane.style.display = "none";
        } else {
            gamePane.style.display = "none";
            settingsPane.style.display = "flex";
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

    const themesBack = themesPane.querySelector(".back");
    themesBack.addEventListener("click", (e) => {
        e.preventDefault();
        hideThemesPane();
    });

    const themesClose = themesPane.querySelector(".close");
    themesClose.addEventListener("click", (e) => {
        e.preventDefault();
        closeThemesPane();
    });

    const overlayBackElem = document.querySelector(".overlay-back");
    overlayBackElem.addEventListener("click", (e) => {
        const dialog = document.querySelector(".dialog");
        closeDialog(dialog, overlayBackElem);
    });

    let snowEmbed = document.getElementById("embedim--snow");
    if (snowEmbed) snowEmbed.style.display = "none";

    let selectedKeyboard = QWERTY_KEYBOARD;
    let highContrastMode = false;
    let hardMode = false;

    const selectableKeyboards = [QWERTY_KEYBOARD, DVORAK_KEYBOARD, ALPHABETICAL_KEYBOARD];

    const switchKeyboard = (keyboard) => {
        if (!keyboard || !selectableKeyboards.includes(keyboard)) {
            keyboard = QWERTY_KEYBOARD;
        }
        selectedKeyboard = keyboard;
    };

    const PREVIEW_BOARD_ROWS = [
        ["correct", "within", "incorrect", "correct", "incorrect"],
        ["within", "correct", "incorrect", "correct", "incorrect"],
        ["correct", "correct", "correct", "correct", "correct"],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
    ];

    const PREVIEW_KEYBOARD_ROWS = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m"],
    ];

    const PREVIEW_LETTER_STATES = {
        c: "correct", r: "within", n: "correct", s: "correct",
        t: "correct", o: "correct", w: "correct", g: "incorrect",
    };

    const updateThemeCardActiveState = () => {
        document.querySelectorAll(".theme-card").forEach((card) => {
            const isSelected = card.dataset.theme === themeManager.getSelectedTheme();
            card.classList.toggle("active", isSelected);
            card.setAttribute("aria-label", isSelected ? `${card.dataset.theme} (selected)` : card.dataset.theme);
        });
    };

    const buildThemeCards = () => {
        const themeCardsElem = document.querySelector(".theme-cards");
        selectableThemes.forEach((theme) => {
            const card = document.createElement("button");
            card.className = `theme-card ${theme}`;
            card.dataset.theme = theme;

            const nameElem = document.createElement("span");
            nameElem.className = "theme-card-name";
            nameElem.innerText = theme;
            card.appendChild(nameElem);

            const boardElem = document.createElement("div");
            boardElem.className = "theme-card-board";
            PREVIEW_BOARD_ROWS.forEach((row) => {
                const rowElem = document.createElement("div");
                rowElem.className = "theme-card-row";
                row.forEach((state) => {
                    const box = document.createElement("div");
                    box.className = `theme-card-box${state ? ` ${state}` : ""}`;
                    rowElem.appendChild(box);
                });
                boardElem.appendChild(rowElem);
            });
            card.appendChild(boardElem);

            const keyboardElem = document.createElement("div");
            keyboardElem.className = "theme-card-keyboard";
            PREVIEW_KEYBOARD_ROWS.forEach((row) => {
                const rowElem = document.createElement("div");
                rowElem.className = "theme-card-keyboard-row";
                row.forEach((letter) => {
                    const key = document.createElement("div");
                    const state = PREVIEW_LETTER_STATES[letter] || "";
                    key.className = `theme-card-key${state ? ` ${state}` : ""}`;
                    rowElem.appendChild(key);
                });
                keyboardElem.appendChild(rowElem);
            });
            card.appendChild(keyboardElem);

            const applyTheme = () => {
                themeManager.switchTheme(theme);
                savePreferenceValue(THEME_PREFERENCE_NAME, theme);
                document.querySelector(`.setting.${THEME_PREFERENCE_NAME}-switch .toggle`).innerText = theme;
                updateThemeCardActiveState();
            };

            card.addEventListener("click", applyTheme);

            themeCardsElem.appendChild(card);
        });
    };

    const settings = document.querySelectorAll(".setting");
    settings.forEach((setting) => {
        setting.addEventListener("click", (e) => {
            const elem = e.target;
            let enabled = false;
            if (elem.classList.contains(`${THEME_PREFERENCE_NAME}-switch`)) {
                showThemesPane();
            } else if (elem.classList.contains(HIGH_CONTRAST_PREFERENCE_NAME)) {
                const knob = setting.querySelector(".knob");
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
                if (enabled) {
                    knob.classList.add("enabled");
                } else {
                    knob.classList.remove("enabled");
                }
            } else if (elem.classList.contains(HARD_MODE_PREFERENCE_NAME)) {
                const knob = setting.querySelector(".knob");
                if (!hardMode && gameState.attempts.length > 0 && !gameState.ended) {
                    return renderNotification(
                        "Hard mode can only be enabled at the start of a round"
                    );
                }
                hardMode = !hardMode;
                savePreferenceValue(
                    HARD_MODE_PREFERENCE_NAME,
                    hardMode ? SETTING_ENABLED : SETTING_DISABLED
                );
                if (hardMode) {
                    knob.classList.add("enabled");
                } else {
                    knob.classList.remove("enabled");
                }
            } else if (elem.classList.contains(`${KEYBOARD_PREFERENCE_NAME}-switch`)) {
                const toggle = setting.querySelector(".toggle");
                const keyboardIndex = selectableKeyboards.indexOf(selectedKeyboard);
                const nextKeyboard = selectableKeyboards[(keyboardIndex + 1) % selectableKeyboards.length];
                switchKeyboard(nextKeyboard);
                savePreferenceValue(KEYBOARD_PREFERENCE_NAME, nextKeyboard);
                toggle.innerText = nextKeyboard === QWERTY_KEYBOARD ? nextKeyboard.toUpperCase() : nextKeyboard;
                renderKeyboard(bottomElem, letterMap, handleKeyInput, handleHoldInput, gameState, selectedKeyboard);
            }
        });
    });

    const migrated = migrateLocalStorage();

    initPreferences();
    themeManager.switchTheme(getPreferenceValue(THEME_PREFERENCE_NAME));
    switchKeyboard(getPreferenceValue(KEYBOARD_PREFERENCE_NAME));
    buildThemeCards();
    const themeSetting = document.querySelector(`.setting.${THEME_PREFERENCE_NAME}-switch`);
    themeSetting.querySelector(".toggle").innerText = themeManager.getSelectedTheme();
    const keyboardSetting = document.querySelector(`.setting.${KEYBOARD_PREFERENCE_NAME}-switch`);
    keyboardSetting.querySelector(".toggle").innerText = selectedKeyboard === QWERTY_KEYBOARD ? selectedKeyboard.toUpperCase() : selectedKeyboard;
    if (getPreferenceValue(HIGH_CONTRAST_PREFERENCE_NAME) === SETTING_ENABLED) {
        highContrastMode = true;
        const setting = document.querySelector(`.setting.${HIGH_CONTRAST_PREFERENCE_NAME}`);
        const knob = setting.querySelector(".knob");
        knob.classList.add("enabled");
        document.body.classList.add(HIGH_CONTRAST);
    }
    if (getPreferenceValue(HARD_MODE_PREFERENCE_NAME) === SETTING_ENABLED) {
        hardMode = true;
        const setting = document.querySelector(`.setting.${HARD_MODE_PREFERENCE_NAME}`);
        const knob = setting.querySelector(".knob");
        knob.classList.add("enabled");
    }

    const landscapeQuery = window.matchMedia("(orientation: landscape)");

    const checkForOrientation = (mediaQueryEvent) => {
        const md =
            typeof MobileDetect !== "undefined" && new MobileDetect(window.navigator.userAgent);
        if (md && mediaQueryEvent.matches && md.mobile()) {
            document.getElementById("landscape-overlay").style.display = "block";
            document.body.classList.add(LANDSCAPE_CLASS_NAME);
            // Have the snow element appear on top of the landscape overlay
            // (will only be visible if the "display" attribute is set, though)
            if (snowEmbed) snowEmbed.style.zIndex = "99999";
        } else {
            document.getElementById("landscape-overlay").style.display = "none";
            document.body.classList.remove(LANDSCAPE_CLASS_NAME);
            if (snowEmbed) snowEmbed.style.zIndex = "";
        }
    };

    if (landscapeQuery.addEventListener) {
        landscapeQuery.addEventListener("change", function (event) {
            checkForOrientation(event);
        });
    } else {
        // Support for older browsers, addListener is deprecated
        landscapeQuery.addListener(checkForOrientation);
    }

    checkForOrientation(landscapeQuery);

    const commitElem = document.querySelector(".commit-hash");
    commitElem.parentElement.href += commitElem.innerText;

    let changelogFetchSuccess = false;
    let changelogHTML;

    const changelogLink = document.querySelector("#changelog-link");
    changelogLink.addEventListener("click", async (e) => {
        e.preventDefault();
        // Fetch changelog
        if (!changelogFetchSuccess) {
            try {
                const res = await fetch("CHANGELOG.html");
                if (res.status !== 200) {
                    console.error("Could not fetch changelog:", res.statusText);
                    changelogHTML = `<p class="changelog-error">Could not retrieve changelog.</p>`;
                } else {
                    changelogHTML = await res.text();
                    changelogFetchSuccess = true;
                }
            } catch (e) {
                console.error("Could not fetch changelog:", e);
                changelogHTML = `<p class="changelog-error">Could not retrieve changelog.</p>`;
            }
        }
        const dialogElem = createDialogContentFromTemplate("#changelog-content");
        const changelogElem = dialogElem.querySelector("#changelog-text");
        changelogElem.innerHTML = changelogHTML;
        if (changelogFetchSuccess) {
            // Capitalize title
            changelogElem.children.item(0).style.textTransform = "uppercase";
            // Remove Keep a Changelog and Unreleased sections
            for (let i = 0; i < 3; i++) {
                const item = changelogElem.children.item(1);
                if (item) {
                    item.remove();
                }
            }
            // All links in this section should open a new tab
            changelogElem.querySelectorAll("a").forEach((elem) => (elem.target = "_blank"));
        }
        renderDialog(dialogElem, {
            fadeIn: true,
            closable: true,
            style: {
                width: "75%",
                height: "75%",
                maxWidth: "600px",
            },
        });
    });

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
        renderDialog(elem, {
            fadeIn: true,
            closable: false,
        });
    }

    if (migrated) {
        renderDialog(createDialogContentFromTemplate("#migration-dialog-content"), {
            fadeIn: true,
            closable: true,
        });
    }

    gameLoaded = true;
});
