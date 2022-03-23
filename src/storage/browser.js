const ATTEMPTS_KEY = "attempts";
const LIVES_KEY = "lives";
const DAY_KEY = "day";
const ENDED_KEY = "ended";
const PLAYED_BEFORE_KEY = "played_before";

const getCurrentDay = () => Math.floor(Date.now() / 1000 / 60 / 60 / 24);

const saveGame = (attempts, lives, ended) => {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    window.localStorage.setItem(LIVES_KEY, lives);
    window.localStorage.setItem(ENDED_KEY, ended);
    window.localStorage.setItem(DAY_KEY, getCurrentDay());
};

const loadGame = () => {
    const attempts = JSON.parse(window.localStorage.getItem(ATTEMPTS_KEY) || "[]");
    const lives = parseInt(window.localStorage.getItem(LIVES_KEY)) || 0;
    const ended = JSON.parse(window.localStorage.getItem(ENDED_KEY) || "false");
    return {
        attempts,
        lives,
        ended,
    };
};

const clearGame = () => {
    window.localStorage.removeItem(ATTEMPTS_KEY);
    window.localStorage.removeItem(LIVES_KEY);
    window.localStorage.removeItem(DAY_KEY);
};

const checkGameValidity = () => parseInt(window.localStorage.getItem(DAY_KEY)) === getCurrentDay();

const checkFirstTime = () => window.localStorage.getItem(PLAYED_BEFORE_KEY) !== "true";

const setPlayedBefore = (status) => window.localStorage.setItem(PLAYED_BEFORE_KEY, status);

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
