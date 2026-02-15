const PREFIX = "wc_";
const ATTEMPTS_KEY = PREFIX + "attempts";
const LIVES_KEY = PREFIX + "lives";
const DAY_KEY = PREFIX + "day";
const ENDED_KEY = PREFIX + "ended";
const PLAYED_BEFORE_KEY = PREFIX + "played_before";
const PREFERENCES_KEY = PREFIX + "preferences";
const WON_HARD_MODE_KEY = PREFIX + "won_hard_mode";

if (typeof process !== "undefined") {
    module.exports = {
        ATTEMPTS_KEY,
        LIVES_KEY,
        DAY_KEY,
        ENDED_KEY,
        PLAYED_BEFORE_KEY,
        PREFERENCES_KEY,
        WON_HARD_MODE_KEY,
    };
}
