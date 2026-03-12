if (typeof process !== "undefined") {
    var pkg = require("../../package.json");
    var storage = require("./index");
    ATTEMPTS_KEY = storage.ATTEMPTS_KEY;
    LIVES_KEY = storage.LIVES_KEY;
    DAY_KEY = storage.DAY_KEY;
    ENDED_KEY = storage.ENDED_KEY;
    PLAYED_BEFORE_KEY = storage.PLAYED_BEFORE_KEY;
    WON_HARD_MODE_KEY = storage.WON_HARD_MODE_KEY;
    PREFERENCES_KEY = storage.PREFERENCES_KEY;
    getCurrentDay = require("../datetime").getCurrentDay;
    var APP_VERSION = pkg.version;
}

const LEGACY_KEY_MAP = {
    attempts: ATTEMPTS_KEY,
    lives: LIVES_KEY,
    day: DAY_KEY,
    ended: ENDED_KEY,
    played_before: PLAYED_BEFORE_KEY,
    won_hard_mode: WON_HARD_MODE_KEY,
    preferences: PREFERENCES_KEY,
};

// Game state keys that should only be migrated if the saved game is current
const GAME_STATE_LEGACY_KEYS = new Set(["attempts", "lives", "day", "ended", "won_hard_mode"]);

const _migrateFuncName =
    "migrateLocalStorage_v" +
    (typeof APP_VERSION !== "undefined" ? APP_VERSION : "1.4.0").replace(/\./g, "_");

const migrateLocalStorage = {
    [_migrateFuncName]: function () {
        let migrated = false;

        try {
            // Check if the legacy game day is still valid (current day)
            const legacyDay = window.localStorage.getItem("day");
            const isGameStateValid =
                legacyDay !== null && parseInt(legacyDay) === getCurrentDay();

            for (const [legacyKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
                // Skip if legacy key doesn't exist
                const legacyValue = window.localStorage.getItem(legacyKey);
                if (legacyValue === null) continue;

                // Skip if new key already exists (don't overwrite)
                if (window.localStorage.getItem(newKey) !== null) continue;

                // For game state keys, skip if the saved game is from a different day
                if (GAME_STATE_LEGACY_KEYS.has(legacyKey) && !isGameStateValid) continue;

                window.localStorage.setItem(newKey, legacyValue);
                migrated = true;
            }
        } catch (e) {
            console.error("Migration failed:", e);
            return false;
        }

        return migrated;
    },
}[_migrateFuncName];

if (typeof process !== "undefined") {
    module.exports = {
        migrateLocalStorage,
        LEGACY_KEY_MAP,
    };
}
