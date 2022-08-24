const sinon = require("sinon");
const assert = require("assert");
const {
    saveGame,
    savePreferences,
    loadGame,
    loadPreferences,
    clearGame,
    clearPreferences,
    checkGameValidity,
    checkFirstTime,
    setPlayedBefore,
} = require("../src/storage/browser");
const cliStorage = require("../src/storage/cli");
const mockFs = require("mock-fs");
const fs = require("fs");
const {
    ATTEMPTS_KEY,
    LIVES_KEY,
    ENDED_KEY,
    DAY_KEY,
    PLAYED_BEFORE_KEY,
} = require("../src/storage");
const { STARTING_LIVES } = require("../src/consts");

global.window = {};

class MockStorage {}
MockStorage.prototype.setItem = (keyName, keyValue) => {};
MockStorage.prototype.getItem = (keyName) => {};
MockStorage.prototype.removeItem = (keyName) => {};

const FAKE_TIMESTAMP = 1642982569804;
const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

const LIVES = 5;
const ATTEMPTS = [
    [
        {
            letter: "b",
            correct: true,
            within: false,
        },
        {
            letter: "r",
            correct: true,
            within: false,
        },
        {
            letter: "e",
            correct: true,
            within: false,
        },
        {
            letter: "a",
            correct: true,
            within: false,
        },
        {
            letter: "k",
            correct: true,
            within: false,
        },
    ],
];

describe("game storage - browser", () => {
    let stubbedLocalStorage;
    let stubbedDateNow;

    beforeEach(() => {
        stubbedLocalStorage = window.localStorage = sinon.stub(MockStorage.prototype);
        stubbedDateNow = sinon.stub(Date, "now").returns(FAKE_TIMESTAMP);
    });
    afterEach(() => {
        sinon.restore();
    });

    it("should save progress", () => {
        sinon.assert.notCalled(stubbedLocalStorage.setItem);
        saveGame(ATTEMPTS, LIVES, true);
        sinon.assert.callCount(stubbedLocalStorage.setItem, 4);
        sinon.assert.calledWithMatch(
            stubbedLocalStorage.setItem,
            ATTEMPTS_KEY,
            JSON.stringify(ATTEMPTS)
        );
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, LIVES_KEY, 5);
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, DAY_KEY, Math.floor(FAKE_DAY));
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, ENDED_KEY, true);
    });

    it("should load progress", () => {
        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs(ATTEMPTS_KEY).returns(JSON.stringify(ATTEMPTS));
        getItemStub.withArgs(LIVES_KEY).returns(LIVES);
        getItemStub.withArgs(ENDED_KEY).returns("true");
        try {
            sinon.assert.notCalled(getItemStub);
            const state = loadGame();
            sinon.assert.calledThrice(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, ATTEMPTS_KEY);
            sinon.assert.calledWithMatch(getItemStub, LIVES_KEY);
            sinon.assert.calledWithMatch(getItemStub, ENDED_KEY);
            assert.deepStrictEqual(state.attempts, ATTEMPTS);
            assert.strictEqual(state.lives, 5);
            assert.strictEqual(state.ended, true);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });

    it("should clear progress", () => {
        sinon.assert.notCalled(stubbedLocalStorage.removeItem);
        clearGame();
        sinon.assert.calledThrice(stubbedLocalStorage.removeItem);
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, ATTEMPTS_KEY);
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, LIVES_KEY);
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, DAY_KEY);
    });

    it("should load default values if no previous state was stored", () => {
        const expectedState = {
            [ATTEMPTS_KEY]: [],
            [LIVES_KEY]: STARTING_LIVES,
            [ENDED_KEY]: false,
        };

        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs(ATTEMPTS_KEY).returns(null);
        getItemStub.withArgs(LIVES_KEY).returns(null);
        getItemStub.withArgs(ENDED_KEY).returns(null);
        try {
            sinon.assert.notCalled(getItemStub);
            const state = loadGame();
            sinon.assert.calledThrice(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, ATTEMPTS_KEY);
            sinon.assert.calledWithMatch(getItemStub, LIVES_KEY);
            sinon.assert.calledWithMatch(getItemStub, ENDED_KEY);
            assert.deepStrictEqual(state.attempts, []);
            assert.strictEqual(state.lives, STARTING_LIVES);
            assert.strictEqual(state.ended, false);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });

    describe("stored progress validity check", () => {
        let origFunc, getItemStub;
        beforeEach(() => {
            origFunc = window.localStorage.getItem;
            getItemStub = window.localStorage.getItem = sinon.stub();
        });
        afterEach(() => {
            window.localStorage.getItem = origFunc;
        });
        it("should be valid if created on the same day", () => {
            getItemStub.withArgs(DAY_KEY).returns(Math.floor(FAKE_DAY).toString());
            sinon.assert.notCalled(getItemStub);
            const isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, DAY_KEY);
            assert(isValid);
        });
        it("should not be valid if created on a different day", () => {
            getItemStub.withArgs(DAY_KEY).returns(Math.floor(FAKE_DAY - 1).toString());
            sinon.assert.notCalled(getItemStub);
            const isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, DAY_KEY);
            assert(!isValid);
        });
        it("should not be valid if day value in storage is not valid", () => {
            getItemStub.withArgs(DAY_KEY).returns(null);
            sinon.assert.notCalled(getItemStub);
            let isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, DAY_KEY);
            assert(!isValid);

            getItemStub.reset();

            getItemStub.withArgs(DAY_KEY).returns("invalid");
            sinon.assert.notCalled(getItemStub);
            isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, DAY_KEY);
            assert(!isValid);
        });
    });

    describe("first time check", () => {
        let origFunc, getItemStub;
        beforeEach(() => {
            origFunc = window.localStorage.getItem;
            getItemStub = window.localStorage.getItem = sinon.stub();
        });
        afterEach(() => {
            window.localStorage.getItem = origFunc;
        });
        it("should return true if 'played before' entry is not in storage", () => {
            getItemStub.withArgs("played_before").returns(null);
            sinon.assert.notCalled(getItemStub);
            const isFirstTime = checkFirstTime();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "played_before");
            assert(isFirstTime);
        });
        it("should return true if 'played before' entry is set to something besides boolean string in storage", () => {
            getItemStub.withArgs("played_before").returns("test");
            sinon.assert.notCalled(getItemStub);
            const isFirstTime = checkFirstTime();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "played_before");
            assert(isFirstTime);
        });
        it("should return true if 'played before' entry is set to false in storage", () => {
            getItemStub.withArgs("played_before").returns("false");
            sinon.assert.notCalled(getItemStub);
            const isFirstTime = checkFirstTime();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "played_before");
            assert(isFirstTime);
        });
        it("should return false if 'played before' entry is set to true in storage", () => {
            getItemStub.withArgs("played_before").returns("true");
            sinon.assert.notCalled(getItemStub);
            const isFirstTime = checkFirstTime();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "played_before");
            assert(!isFirstTime);
        });
    });

    // NTS: Real local storage casts values to strings implicitly, these tests don't test for that, just test whether the function would be called with the value
    describe("setting 'played before' status", () => {
        it("should set 'played before' to true if true is passed", () => {
            sinon.assert.notCalled(stubbedLocalStorage.setItem);
            setPlayedBefore(true);
            sinon.assert.calledOnce(stubbedLocalStorage.setItem);
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, "played_before", true);
        });
        it("should set 'played before' to false if false is passed", () => {
            sinon.assert.notCalled(stubbedLocalStorage.setItem);
            setPlayedBefore(false);
            sinon.assert.calledOnce(stubbedLocalStorage.setItem);
            sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, "played_before", false);
        });
    });
});

describe("game storage - CLI", () => {
    beforeEach(() => {
        mockFs({
            "state.json": JSON.stringify({}),
        });
        stubbedDateNow = sinon.stub(Date, "now").returns(FAKE_TIMESTAMP);
    });
    afterEach(() => {
        mockFs.restore();
        sinon.restore();
    });

    it("should save progress", () => {
        const expectedState = {
            [ATTEMPTS_KEY]: ATTEMPTS,
            [LIVES_KEY]: LIVES,
            [ENDED_KEY]: true,
            [DAY_KEY]: FAKE_DAY,
        };

        cliStorage.saveGame(ATTEMPTS, LIVES, true);

        let stateContents = fs.readFileSync("state.json", {
            encoding: "utf-8",
        });

        assert.deepStrictEqual(JSON.parse(stateContents), expectedState);
    });

    it("should load progress", () => {
        const expectedState = {
            [ATTEMPTS_KEY]: ATTEMPTS,
            [LIVES_KEY]: LIVES,
            [ENDED_KEY]: true,
        };

        mockFs({
            "state.json": JSON.stringify(expectedState),
        });

        const state = cliStorage.loadGame();

        assert.deepStrictEqual(state, expectedState);
    });

    it("should clear progress", () => {
        const expectedState = {
            [ATTEMPTS_KEY]: [],
            [LIVES_KEY]: STARTING_LIVES,
            [ENDED_KEY]: false,
        };

        mockFs({
            "state.json": JSON.stringify({
                [ATTEMPTS_KEY]: ATTEMPTS,
                [LIVES_KEY]: LIVES,
                [ENDED_KEY]: true,
                [DAY_KEY]: FAKE_DAY,
            }),
        });

        let state = cliStorage.loadGame();

        assert.notDeepStrictEqual(state, expectedState);

        cliStorage.clearGame();

        state = cliStorage.loadGame();

        assert.deepStrictEqual(state, expectedState);
    });

    it("should load default values if no previous state was stored", () => {
        const expectedState = {
            [ATTEMPTS_KEY]: [],
            [LIVES_KEY]: STARTING_LIVES,
            [ENDED_KEY]: false,
        };

        mockFs();

        let state = cliStorage.loadGame();

        assert.deepStrictEqual(state, expectedState);
    });

    describe("stored progress validity check", () => {
        it("should be valid if created on the same day", () => {
            mockFs({
                "state.json": JSON.stringify({
                    [ATTEMPTS_KEY]: ATTEMPTS,
                    [LIVES_KEY]: LIVES,
                    [ENDED_KEY]: true,
                    [DAY_KEY]: FAKE_DAY,
                }),
            });

            const isValid = cliStorage.checkGameValidity();

            assert(isValid);
        });
        it("should not be valid if created on a different day", () => {
            mockFs({
                "state.json": JSON.stringify({
                    [ATTEMPTS_KEY]: ATTEMPTS,
                    [LIVES_KEY]: LIVES,
                    [ENDED_KEY]: true,
                    [DAY_KEY]: FAKE_DAY - 1,
                }),
            });

            const isValid = cliStorage.checkGameValidity();

            assert(!isValid);
        });
        it("should not be valid if day value in storage is not valid", () => {
            mockFs({
                "state.json": JSON.stringify({
                    [ATTEMPTS_KEY]: ATTEMPTS,
                    [LIVES_KEY]: LIVES,
                    [ENDED_KEY]: true,
                    [DAY_KEY]: "invalid",
                }),
            });

            let isValid = cliStorage.checkGameValidity();

            assert(!isValid);

            mockFs({
                "state.json": JSON.stringify({
                    [ATTEMPTS_KEY]: ATTEMPTS,
                    [LIVES_KEY]: LIVES,
                    [ENDED_KEY]: true,
                    [DAY_KEY]: null,
                }),
            });

            isValid = cliStorage.checkGameValidity();

            assert(!isValid);
        });
    });

    describe("first time check", () => {
        it("should return true if 'played before' entry is not in storage", () => {
            mockFs();

            const firstTime = cliStorage.checkFirstTime();

            assert(firstTime);
        });
        it("should return true if 'played before' entry is set to something besides boolean in storage", () => {
            mockFs({
                "playedbefore.json": JSON.stringify({
                    [PLAYED_BEFORE_KEY]: "something",
                }),
            });

            const firstTime = cliStorage.checkFirstTime();

            assert(firstTime);
        });
        it("should return true if 'played before' entry is set to false in storage", () => {
            mockFs({
                "playedbefore.json": JSON.stringify({
                    [PLAYED_BEFORE_KEY]: false,
                }),
            });

            const firstTime = cliStorage.checkFirstTime();

            assert(firstTime);
        });
        it("should return false if 'played before' entry is set to true in storage", () => {
            mockFs({
                "playedbefore.json": JSON.stringify({
                    [PLAYED_BEFORE_KEY]: true,
                }),
            });

            const firstTime = cliStorage.checkFirstTime();

            assert(!firstTime);
        });
    });

    describe("setting 'played before' status", () => {
        it("should set 'played before' to true if true is passed", () => {
            mockFs({
                "playedbefore.json": JSON.stringify({
                    [PLAYED_BEFORE_KEY]: false,
                }),
            });

            let stateContents = fs.readFileSync("playedbefore.json", {
                encoding: "utf-8",
            });

            assert.deepStrictEqual(JSON.parse(stateContents), {
                [PLAYED_BEFORE_KEY]: false,
            });

            cliStorage.setPlayedBefore(true);

            stateContents = fs.readFileSync("playedbefore.json", {
                encoding: "utf-8",
            });

            assert.deepStrictEqual(JSON.parse(stateContents), {
                [PLAYED_BEFORE_KEY]: true,
            });
        });
        it("should set 'played before' to false if false is passed", () => {
            mockFs({
                "playedbefore.json": JSON.stringify({
                    [PLAYED_BEFORE_KEY]: true,
                }),
            });

            let stateContents = fs.readFileSync("playedbefore.json", {
                encoding: "utf-8",
            });

            assert.deepStrictEqual(JSON.parse(stateContents), {
                [PLAYED_BEFORE_KEY]: true,
            });

            cliStorage.setPlayedBefore(false);

            stateContents = fs.readFileSync("playedbefore.json", {
                encoding: "utf-8",
            });

            assert.deepStrictEqual(JSON.parse(stateContents), {
                [PLAYED_BEFORE_KEY]: false,
            });
        });
    });
});

describe("preferences storage - browser", () => {
    let stubbedLocalStorage;

    beforeEach(() => {
        stubbedLocalStorage = window.localStorage = sinon.stub(MockStorage.prototype);
    });
    afterEach(() => {
        sinon.restore();
    });

    it("can store preferences", () => {
        const preferences = {
            my_setting: "my-value",
        };

        sinon.assert.notCalled(stubbedLocalStorage.setItem);
        savePreferences(preferences);
        sinon.assert.calledOnce(stubbedLocalStorage.setItem);
        sinon.assert.calledWithMatch(
            stubbedLocalStorage.setItem,
            "preferences",
            JSON.stringify(preferences)
        );
    });

    it("can load preferences", () => {
        const preferences = {
            my_setting: "my-value",
        };

        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs("preferences").returns(JSON.stringify(preferences));
        try {
            sinon.assert.notCalled(getItemStub);
            const loadedPreferences = loadPreferences();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "preferences");
            assert.deepStrictEqual(loadedPreferences, preferences);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });

    it("can clear preferences", () => {
        sinon.assert.notCalled(stubbedLocalStorage.removeItem);
        clearPreferences();
        sinon.assert.calledOnce(stubbedLocalStorage.removeItem);
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, "preferences");
    });

    it("can handle loading state that is not an object", () => {
        const preferences = "a string";
        const expected = {};

        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs("preferences").returns(JSON.stringify(preferences));
        try {
            sinon.assert.notCalled(getItemStub);
            const loadedPreferences = loadPreferences();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "preferences");
            assert.deepStrictEqual(loadedPreferences, expected);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });

    it("can handle loading invalid state", () => {
        const preferences = "invalid";
        const expected = {};

        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs("preferences").returns(preferences);
        try {
            sinon.assert.notCalled(getItemStub);
            const loadedPreferences = loadPreferences();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "preferences");
            assert.deepStrictEqual(loadedPreferences, expected);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });
});

describe("preferences storage - CLI", () => {
    beforeEach(() => {
        mockFs({
            "preferences.json": JSON.stringify({}),
        });
    });
    afterEach(() => {
        mockFs.restore();
    });

    it("can store preferences", () => {
        const preferences = {
            "test-key": "test-value",
        };

        cliStorage.savePreferences(preferences);

        const preferencesFileContents = fs.readFileSync("preferences.json", {
            encoding: "utf-8",
        });

        assert.deepStrictEqual(JSON.parse(preferencesFileContents), preferences);
    });

    it("can load preferences", () => {
        const expectedPreferences = {
            "test-key": "test-value",
        };

        mockFs({
            "preferences.json": JSON.stringify(expectedPreferences),
        });

        preferences = cliStorage.loadPreferences();

        assert.deepStrictEqual(preferences, expectedPreferences);
    });

    it("can clear preferences", () => {
        const expectedPreferences = {
            "test-key": "test-value",
        };

        mockFs({
            "preferences.json": JSON.stringify(expectedPreferences),
        });

        let preferencesFileContents = fs.readFileSync("preferences.json", {
            encoding: "utf-8",
        });

        assert.deepStrictEqual(JSON.parse(preferencesFileContents), expectedPreferences);

        cliStorage.clearPreferences();

        preferencesFileContents = fs.readFileSync("preferences.json", {
            encoding: "utf-8",
        });

        assert.deepStrictEqual(JSON.parse(preferencesFileContents), {});
    });

    it("can handle loading state that is not an object", () => {
        const expectedPreferences = {};

        mockFs({
            "preferences.json": '"a string"',
        });

        preferences = cliStorage.loadPreferences();

        assert.deepStrictEqual(preferences, expectedPreferences);
    });

    it("can handle loading invalid state", () => {
        const expectedPreferences = {};

        mockFs({
            "preferences.json": "invalid state",
        });

        preferences = cliStorage.loadPreferences();

        assert.deepStrictEqual(preferences, expectedPreferences);
    });

    it("can handle preferences file not existing", () => {
        const expectedPreferences = {};

        mockFs({});

        preferences = cliStorage.loadPreferences();

        assert.deepStrictEqual(preferences, expectedPreferences);
    });
});
