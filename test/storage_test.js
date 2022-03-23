const sinon = require("sinon");
const assert = require("assert");
const {
    saveGame,
    loadGame,
    clearGame,
    checkGameValidity,
    checkFirstTime,
    setPlayedBefore,
} = require("../src/storage/browser");

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

describe("game storage", () => {
    let stubbedLocalStorage;
    let stubbedDateNow;

    beforeEach(() => {
        stubbedLocalStorage = window.localStorage = sinon.stub(MockStorage.prototype);
        console.log(window.localStorage);
        console.log(Date.now());
        stubbedDateNow = sinon.stub(Date, "now").returns(FAKE_TIMESTAMP);
        console.log(Date.now());
    });
    afterEach(() => {
        sinon.restore();
        console.log(Date.now());
    });
    it("should save progress", () => {
        sinon.assert.notCalled(stubbedLocalStorage.setItem);
        saveGame(ATTEMPTS, LIVES, true);
        sinon.assert.callCount(stubbedLocalStorage.setItem, 4);
        sinon.assert.calledWithMatch(
            stubbedLocalStorage.setItem,
            "attempts",
            JSON.stringify(ATTEMPTS)
        );
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, "lives", 5);
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, "day", Math.floor(FAKE_DAY));
        sinon.assert.calledWithMatch(stubbedLocalStorage.setItem, "ended", true);
    });
    it("should load progress", () => {
        const origFunc = window.localStorage.getItem;
        const getItemStub = (window.localStorage.getItem = sinon.stub());
        getItemStub.withArgs("attempts").returns(JSON.stringify(ATTEMPTS));
        getItemStub.withArgs("lives").returns(LIVES);
        getItemStub.withArgs("ended").returns("true");
        try {
            sinon.assert.notCalled(getItemStub);
            const state = loadGame();
            sinon.assert.calledThrice(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "attempts");
            sinon.assert.calledWithMatch(getItemStub, "lives");
            sinon.assert.calledWithMatch(getItemStub, "ended");
            assert.deepStrictEqual(state.attempts, ATTEMPTS);
            assert.strictEqual(state.lives, 5);
        } finally {
            window.localStorage.getItem = origFunc;
        }
    });
    it("should clear progress", () => {
        sinon.assert.notCalled(stubbedLocalStorage.removeItem);
        clearGame();
        sinon.assert.calledThrice(stubbedLocalStorage.removeItem);
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, "attempts");
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, "lives");
        sinon.assert.calledWithMatch(stubbedLocalStorage.removeItem, "day");
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
            getItemStub.withArgs("day").returns(Math.floor(FAKE_DAY).toString());
            sinon.assert.notCalled(getItemStub);
            const isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "day");
            assert(isValid);
        });
        it("should not be valid if created on a different day", () => {
            getItemStub.withArgs("day").returns(Math.floor(FAKE_DAY - 1).toString());
            sinon.assert.notCalled(getItemStub);
            const isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "day");
            assert(!isValid);
        });
        it("should not be valid if day value in storage is not valid", () => {
            getItemStub.withArgs("day").returns(null);
            sinon.assert.notCalled(getItemStub);
            const isValid = checkGameValidity();
            sinon.assert.calledOnce(getItemStub);
            sinon.assert.calledWithMatch(getItemStub, "day");
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
