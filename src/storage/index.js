const ATTEMPTS_KEY = "attempts";
const LIVES_KEY = "lives";
const DAY_KEY = "day";
const ENDED_KEY = "ended";
const PLAYED_BEFORE_KEY = "played_before";
const LAST_VERSION_KEY = "last_version";
const PREFERENCES_KEY = "preferences";
const WON_HARD_MODE_KEY = "won_hard_mode";

if (typeof process !== "undefined") {
    module.exports = {
        ATTEMPTS_KEY,
        LIVES_KEY,
        DAY_KEY,
        ENDED_KEY,
        PLAYED_BEFORE_KEY,
        LAST_VERSION_KEY,
        PREFERENCES_KEY,
        WON_HARD_MODE_KEY,
    };
}
