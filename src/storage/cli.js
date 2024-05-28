const {
    ATTEMPTS_KEY,
    LIVES_KEY,
    DAY_KEY,
    ENDED_KEY,
    PLAYED_BEFORE_KEY,
    PREFERENCES_KEY,
    WON_HARD_MODE_KEY,
} = require("./index");
const fs = require("fs");
const path = require("path");
const xdg = require("@folder/xdg");
const { STARTING_LIVES } = require("../consts");
const { getCurrentDay } = require("../datetime");

const dirs = xdg({
    subdir: "wordle-clone",
    resolve: (parentdir, ...args) => {
        return path.join(parentdir, ...args);
    },
});

const STATE_JSON_FILENAME = path.join(dirs.data, "state.json");
const PREFERENCES_JSON_FILENAME = path.join(dirs.config, "preferences.json");

const saveGame = (attempts, lives, ended, day, wonHardMode) => {
    overwriteState({
        [ATTEMPTS_KEY]: attempts,
        [LIVES_KEY]: lives,
        [ENDED_KEY]: ended,
        [DAY_KEY]: day,
        [WON_HARD_MODE_KEY]: wonHardMode,
    });
};

const savePreferences = (preferences) => {
    createDirectoryIfNotExist(dirs.config);
    fs.writeFileSync(PREFERENCES_JSON_FILENAME, JSON.stringify(preferences));
};

const loadGame = () => {
    if (fs.existsSync(STATE_JSON_FILENAME)) {
        const jsonStr = fs.readFileSync(STATE_JSON_FILENAME);
        const json = JSON.parse(jsonStr);
        // NTS: "date" is saved to game state, but it's not needed besides checking validity, so this field will be omitted
        return {
            attempts: json[ATTEMPTS_KEY] || [],
            lives: json[LIVES_KEY] ?? STARTING_LIVES,
            ended: json[ENDED_KEY] || false,
            wonHardMode: json[WON_HARD_MODE_KEY] || false,
        };
    }
    return {
        attempts: [],
        lives: STARTING_LIVES,
        ended: false,
        wonHardMode: false,
    };
};

const loadPreferences = () => {
    if (fs.existsSync(PREFERENCES_JSON_FILENAME)) {
        const jsonStr = fs.readFileSync(PREFERENCES_JSON_FILENAME);
        try {
            const json = JSON.parse(jsonStr);
            if (typeof json !== "object") {
                return {};
            }
            return json;
        } catch (e) {
            return {};
        }
    }
    return {};
};

const clearGame = () => {
    createDirectoryIfNotExist(dirs.data);
    fs.writeFileSync(STATE_JSON_FILENAME, "{}");
};

const clearPreferences = () => {
    createDirectoryIfNotExist(dirs.config);
    fs.writeFileSync(PREFERENCES_JSON_FILENAME, "{}");
};

const checkGameValidity = () => {
    if (fs.existsSync(STATE_JSON_FILENAME)) {
        const jsonStr = fs.readFileSync(STATE_JSON_FILENAME);
        const json = JSON.parse(jsonStr);
        return json[DAY_KEY] === getCurrentDay();
    }
    return false;
};

const checkFirstTime = () => {
    if (fs.existsSync(STATE_JSON_FILENAME)) {
        const jsonStr = fs.readFileSync(STATE_JSON_FILENAME);
        const json = JSON.parse(jsonStr);
        return json[PLAYED_BEFORE_KEY] !== true;
    }
    return true;
};

const setPlayedBefore = (status) => {
    overwriteState({
        [PLAYED_BEFORE_KEY]: status,
    });
};

const overwriteState = (newState) => {
    let json;
    if (fs.existsSync(STATE_JSON_FILENAME)) {
        const jsonStr = fs.readFileSync(STATE_JSON_FILENAME);
        json = JSON.parse(jsonStr);
    } else {
        json = {};
    }
    json = Object.assign(json, newState);
    const jsonStr = JSON.stringify(json);
    createDirectoryIfNotExist(dirs.data);
    fs.writeFileSync(STATE_JSON_FILENAME, jsonStr);
};

const createDirectoryIfNotExist = (directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {
            recursive: true,
        });
    }
};

if (typeof process !== "undefined") {
    module.exports = {
        STATE_JSON_FILENAME,
        PREFERENCES_JSON_FILENAME,
        saveGame,
        savePreferences,
        loadGame,
        loadPreferences,
        clearGame,
        clearPreferences,
        checkGameValidity,
        checkFirstTime,
        setPlayedBefore,
    };
}
