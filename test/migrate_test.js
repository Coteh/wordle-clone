const sinon = require("sinon");
const assert = require("assert");
const { migrateLocalStorage, LEGACY_KEY_MAP } = require("../src/storage/migrate");
const {
    ATTEMPTS_KEY,
    LIVES_KEY,
    ENDED_KEY,
    DAY_KEY,
    PLAYED_BEFORE_KEY,
    PREFERENCES_KEY,
    WON_HARD_MODE_KEY,
} = require("../src/storage");
const { getCurrentDay } = require("../src/datetime");

global.window = {};

class MockStorage {}
// Define prototype methods so sinon can stub them
MockStorage.prototype.setItem = (keyName, keyValue) => {};
MockStorage.prototype.getItem = (keyName) => {};
MockStorage.prototype.removeItem = (keyName) => {};

const FAKE_TIMESTAMP = 1642982569804;
const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

const LIVES = 5;
const ATTEMPTS = [
    [
        { letter: "b", correct: true, within: false },
        { letter: "r", correct: true, within: false },
        { letter: "e", correct: true, within: false },
        { letter: "a", correct: true, within: false },
        { letter: "k", correct: true, within: false },
    ],
];
const PREFERENCES = { theme: "dark" };

describe("localStorage migration", () => {
    let stubbedLocalStorage;
    let stubbedDateNow;
    let storage;

    beforeEach(() => {
        stubbedLocalStorage = window.localStorage = sinon.stub(MockStorage.prototype);
        stubbedDateNow = sinon.stub(Date, "now").returns(FAKE_TIMESTAMP);
        storage = {};
    });

    afterEach(() => {
        sinon.restore();
    });

    const setupGetItem = (data) => {
        stubbedLocalStorage.getItem.callsFake((key) => {
            return key in data ? data[key] : null;
        });
    };

    it("should have LEGACY_KEY_MAP with all expected keys", () => {
        assert.strictEqual(LEGACY_KEY_MAP["attempts"], ATTEMPTS_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["lives"], LIVES_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["day"], DAY_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["ended"], ENDED_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["played_before"], PLAYED_BEFORE_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["won_hard_mode"], WON_HARD_MODE_KEY);
        assert.strictEqual(LEGACY_KEY_MAP["preferences"], PREFERENCES_KEY);
    });

    it("should have a dynamically named function based on app version", () => {
        assert.strictEqual(migrateLocalStorage.name, "migrateLocalStorage_v1_4_0");
    });

    describe("full migration", () => {
        it("should migrate all legacy keys to new keys when no new keys exist", () => {
            setupGetItem({
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                day: String(FAKE_DAY),
                ended: "false",
                played_before: "true",
                won_hard_mode: "false",
                preferences: JSON.stringify(PREFERENCES),
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, true);
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                ATTEMPTS_KEY,
                JSON.stringify(ATTEMPTS)
            );
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, LIVES_KEY, String(LIVES));
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, DAY_KEY, String(FAKE_DAY));
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, ENDED_KEY, "false");
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                PLAYED_BEFORE_KEY,
                "true"
            );
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                WON_HARD_MODE_KEY,
                "false"
            );
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                PREFERENCES_KEY,
                JSON.stringify(PREFERENCES)
            );
        });
    });

    describe("no migration", () => {
        it("should return false and not migrate when no legacy keys exist", () => {
            setupGetItem({});

            const result = migrateLocalStorage();

            assert.strictEqual(result, false);
            sinon.assert.notCalled(stubbedLocalStorage.setItem);
        });

        it("should return false when all new keys are already populated", () => {
            setupGetItem({
                // Legacy keys
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                day: String(FAKE_DAY),
                ended: "false",
                played_before: "true",
                won_hard_mode: "false",
                preferences: JSON.stringify(PREFERENCES),
                // New keys (already populated)
                [ATTEMPTS_KEY]: JSON.stringify(ATTEMPTS),
                [LIVES_KEY]: String(LIVES),
                [DAY_KEY]: String(FAKE_DAY),
                [ENDED_KEY]: "false",
                [PLAYED_BEFORE_KEY]: "true",
                [WON_HARD_MODE_KEY]: "false",
                [PREFERENCES_KEY]: JSON.stringify(PREFERENCES),
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, false);
            sinon.assert.notCalled(stubbedLocalStorage.setItem);
        });

        it("should return false when game state is outdated and no preference legacy keys exist", () => {
            setupGetItem({
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                day: String(FAKE_DAY - 1),
                ended: "false",
                won_hard_mode: "false",
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, false);
            sinon.assert.notCalled(stubbedLocalStorage.setItem);
        });
    });

    describe("partial migration", () => {
        it("should only migrate legacy keys that don't have corresponding new keys", () => {
            setupGetItem({
                // Legacy keys
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                day: String(FAKE_DAY),
                ended: "false",
                played_before: "true",
                won_hard_mode: "false",
                preferences: JSON.stringify(PREFERENCES),
                // Only some new keys already exist
                [ATTEMPTS_KEY]: JSON.stringify(ATTEMPTS),
                [LIVES_KEY]: String(LIVES),
                [DAY_KEY]: String(FAKE_DAY),
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, true);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, ATTEMPTS_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, LIVES_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, DAY_KEY);
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, ENDED_KEY, "false");
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, PLAYED_BEFORE_KEY, "true");
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, WON_HARD_MODE_KEY, "false");
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                PREFERENCES_KEY,
                JSON.stringify(PREFERENCES)
            );
        });

        it("should migrate preference keys even when game state is outdated", () => {
            setupGetItem({
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                day: String(FAKE_DAY - 1),
                ended: "false",
                played_before: "true",
                won_hard_mode: "false",
                preferences: JSON.stringify(PREFERENCES),
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, true);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, ATTEMPTS_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, LIVES_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, DAY_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, ENDED_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, WON_HARD_MODE_KEY);
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, PLAYED_BEFORE_KEY, "true");
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                PREFERENCES_KEY,
                JSON.stringify(PREFERENCES)
            );
        });

        it("should not migrate game state keys when day is null in legacy storage", () => {
            setupGetItem({
                attempts: JSON.stringify(ATTEMPTS),
                lives: String(LIVES),
                ended: "false",
                won_hard_mode: "false",
                played_before: "true",
                preferences: JSON.stringify(PREFERENCES),
            });

            const result = migrateLocalStorage();

            assert.strictEqual(result, true);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, ATTEMPTS_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, LIVES_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, ENDED_KEY);
            sinon.assert.neverCalledWithMatch(stubbedLocalStorage.setItem, WON_HARD_MODE_KEY);
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, PLAYED_BEFORE_KEY, "true");
            sinon.assert.calledWithMatch(
                stubbedLocalStorage.setItem,
                PREFERENCES_KEY,
                JSON.stringify(PREFERENCES)
            );
        });
    });

    describe("error handling", () => {
        it("should return false if localStorage throws an error", () => {
            stubbedLocalStorage.getItem.throws(new Error("localStorage access denied"));

            const result = migrateLocalStorage();

            assert.strictEqual(result, false);
        });
    });
});
