const sinon = require("sinon");
const assert = require("assert");
const {
    getCurrentDay,
    getNextDay,
    getNextDate,
    getCountdownToNextDay,
    getCountdownToNextDayString,
} = require("../src/datetime");

const FAKE_TIMESTAMP = 1642968469204;
const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

describe("datetime", () => {
    beforeEach(() => {
        stubbedDateNow = sinon.stub(Date, "now").returns(FAKE_TIMESTAMP);
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should get the current day", () => {
        assert.strictEqual(getCurrentDay(), FAKE_DAY);
    });
    it("should get the next day", () => {
        assert.strictEqual(getNextDay(), FAKE_DAY + 1);
    });
    it("should get the next Date", () => {
        assert.deepStrictEqual(getNextDate(), new Date((FAKE_DAY + 1) * 24 * 60 * 60 * 1000));
    });
    it("should get countdown to next day", () => {
        assert.deepStrictEqual(getCountdownToNextDay(), {
            hours: 3,
            minutes: 52,
            seconds: 10,
        });
    });
    it("should get countdown to next day in a formatted string", () => {
        assert.strictEqual(getCountdownToNextDayString(), "03:52:10");
    });
});
