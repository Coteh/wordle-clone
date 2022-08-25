if (typeof process !== "undefined") {
    const storage = require("./storage");
    savePreferences = storage.savePreferences;
    loadPreferences = storage.loadPreferences;
    clearPreferences = storage.clearPreferences;
}

let preferences = {};

const initPreferences = () => {
    preferences = loadPreferences();
};

const getPreferenceValue = (key) => {
    return preferences[key];
};

const savePreferenceValue = (key, value) => {
    preferences[key] = value;
    savePreferences(preferences);
};

const resetPreferences = () => {
    clearPreferences();
};

if (typeof process !== "undefined") {
    module.exports.initPreferences = initPreferences;
    module.exports.getPreferenceValue = getPreferenceValue;
    module.exports.savePreferenceValue = savePreferenceValue;
    module.exports.resetPreferences = resetPreferences;
}
