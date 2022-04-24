const { ATTEMPTS_KEY, LIVES_KEY, DAY_KEY, ENDED_KEY, PLAYED_BEFORE_KEY } = require("./index");
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

const loadGame = () => {
    if (fs.existsSync("state.json")) {
        const jsonStr = fs.readFileSync("state.json");
        const json = JSON.parse(jsonStr);
        return {
            attempts: json[ATTEMPTS_KEY],
            lives: json[LIVES_KEY],
            ended: json[ENDED_KEY],
        };
    }
    return {
        attempts: [],
        lives: STARTING_LIVES,
        ended: false,
    };
};

const clearGame = () => {
    fs.writeFileSync("state.json", "{}");
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
        loadGame,
        clearGame,
        checkGameValidity,
        checkFirstTime,
        setPlayedBefore,
    };
}
