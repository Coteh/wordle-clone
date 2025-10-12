if (typeof process !== "undefined") {
    const storage = require("./index");
    ATTEMPTS_KEY = storage.ATTEMPTS_KEY;
    LIVES_KEY = storage.LIVES_KEY;
    DAY_KEY = storage.DAY_KEY;
    ENDED_KEY = storage.ENDED_KEY;
    PLAYED_BEFORE_KEY = storage.PLAYED_BEFORE_KEY;
    LAST_VERSION_KEY = storage.LAST_VERSION_KEY;
    WON_HARD_MODE_KEY = storage.WON_HARD_MODE_KEY;
    PREFERENCES_KEY = storage.PREFERENCES_KEY;
    STARTING_LIVES = require("../consts").STARTING_LIVES;
}

const saveGame = (attempts, lives, ended, day, wonHardMode) => {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    window.localStorage.setItem(LIVES_KEY, lives);
    window.localStorage.setItem(ENDED_KEY, ended);
    window.localStorage.setItem(DAY_KEY, day);
    window.localStorage.setItem(WON_HARD_MODE_KEY, wonHardMode);
};

const savePreferences = (preferences) => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
};

const loadGame = () => {
    const attempts = JSON.parse(window.localStorage.getItem(ATTEMPTS_KEY)) || [];
    let lives = parseInt(window.localStorage.getItem(LIVES_KEY));
    if (lives == null || isNaN(lives)) {
        lives = STARTING_LIVES;
    }
    const ended = JSON.parse(window.localStorage.getItem(ENDED_KEY)) || false;
    const wonHardMode = JSON.parse(window.localStorage.getItem(WON_HARD_MODE_KEY)) || false;
    return {
        attempts,
        lives,
        ended,
        wonHardMode,
    };
};

const loadPreferences = () => {
    try {
        const preferences = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY));
        if (!preferences || typeof preferences !== "object") {
            return {};
        }
        return preferences;
    } catch {
        const fallback = {};
        savePreferences(fallback);
        return fallback;
    }
};

const clearGame = () => {
    window.localStorage.removeItem(ATTEMPTS_KEY);
    window.localStorage.removeItem(LIVES_KEY);
    window.localStorage.removeItem(DAY_KEY);
    window.localStorage.removeItem(WON_HARD_MODE_KEY);
};

const clearPreferences = () => {
    window.localStorage.removeItem(PREFERENCES_KEY);
};

const checkGameValidity = () => parseInt(window.localStorage.getItem(DAY_KEY)) === getCurrentDay();

const checkFirstTime = () => window.localStorage.getItem(PLAYED_BEFORE_KEY) !== "true";

const setPlayedBefore = (status) => window.localStorage.setItem(PLAYED_BEFORE_KEY, status);

const hasPlayedPreviousVersion = () => {
    const lastVersion = window.localStorage.getItem(LAST_VERSION_KEY);
    const hasPlayedBefore = !checkFirstTime();
    return hasPlayedBefore && (!!!lastVersion || lastVersion !== GAME_VERSION);
};

const setLastVersion = (version) => window.localStorage.setItem(LAST_VERSION_KEY, GAME_VERSION);

if (typeof process !== "undefined") {
    module.exports = {
        saveGame,
        savePreferences,
        loadGame,
        loadPreferences,
        clearGame,
        clearPreferences,
        checkGameValidity,
        checkFirstTime,
        setPlayedBefore,
        hasPlayedPreviousVersion,
        setLastVersion,
    };
}
