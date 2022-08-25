const {
    ATTEMPTS_KEY,
    LIVES_KEY,
    DAY_KEY,
    ENDED_KEY,
    PLAYED_BEFORE_KEY,
    PREFERENCES_KEY,
} = require("./index");
const fs = require("fs");
const { STARTING_LIVES } = require("../consts");
const { getCurrentDay } = require("../datetime");

const saveGame = (attempts, lives, ended) => {
    const jsonStr = JSON.stringify({
        [ATTEMPTS_KEY]: attempts,
        [LIVES_KEY]: lives,
        [ENDED_KEY]: ended,
        [DAY_KEY]: getCurrentDay(),
    });
    fs.writeFileSync("state.json", jsonStr);
};

const savePreferences = (preferences) => {
    fs.writeFileSync("preferences.json", JSON.stringify(preferences));
};

const loadGame = () => {
    if (fs.existsSync("state.json")) {
        const jsonStr = fs.readFileSync("state.json");
        const json = JSON.parse(jsonStr);
        // NTS: "date" is saved to game state, but it's not needed besides checking validity, so this field will be omitted
        return {
            [ATTEMPTS_KEY]: json[ATTEMPTS_KEY] || [],
            [LIVES_KEY]: json[LIVES_KEY] ?? STARTING_LIVES,
            [ENDED_KEY]: json[ENDED_KEY] || false,
        };
    }
    return {
        [ATTEMPTS_KEY]: [],
        [LIVES_KEY]: STARTING_LIVES,
        [ENDED_KEY]: false,
    };
};

const loadPreferences = () => {
    if (fs.existsSync("preferences.json")) {
        const jsonStr = fs.readFileSync("preferences.json");
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
    fs.writeFileSync("state.json", "{}");
};

const clearPreferences = () => {
    fs.writeFileSync("preferences.json", "{}");
};

const checkGameValidity = () => {
    if (fs.existsSync("state.json")) {
        const jsonStr = fs.readFileSync("state.json");
        const json = JSON.parse(jsonStr);
        return json[DAY_KEY] === getCurrentDay();
    }
    return false;
};

const checkFirstTime = () => {
    if (fs.existsSync("playedbefore.json")) {
        const jsonStr = fs.readFileSync("playedbefore.json");
        const json = JSON.parse(jsonStr);
        return json[PLAYED_BEFORE_KEY] !== true;
    }
    return true;
};

const setPlayedBefore = (status) => {
    const jsonStr = JSON.stringify({
        [PLAYED_BEFORE_KEY]: status,
    });
    fs.writeFileSync("playedbefore.json", jsonStr);
};

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
    };
}
