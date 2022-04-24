const sinon = require("sinon");
const assert = require("assert");
const {
    getCurrentDay,
    getNextDay,
    getNextDate,
    getCountdown,
    getCountdownString,
} = require("../src/datetime");

const getExpectedDateValues = (expectedCurrentDay) => ({
    expectedCurrentDay,
    expectedNextDay: expectedCurrentDay + 1,
    expectedNextDate: new Date((expectedCurrentDay + 1) * 24 * 60 * 60 * 1000),
});

const fakeTimestamps = [
    {
        description: "Normal case",
        ...(() => {
            const FAKE_TIMESTAMP = 1642968469204;
            const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

            return {
                timestamp: FAKE_TIMESTAMP,
                ...getExpectedDateValues(FAKE_DAY),
                countdownDate: new Date((FAKE_DAY + 1) * 24 * 60 * 60 * 1000),
            };
        })(),
        expectedCountdown: {
            hours: 3,
            minutes: 52,
            seconds: 10,
        },
        expectedCountdownString: "03:52:10",
    },
    {
        description: "0 seconds left",
        ...(() => {
            const FAKE_TIMESTAMP = 1650844800120;
            const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

            return {
                timestamp: FAKE_TIMESTAMP,
                ...getExpectedDateValues(FAKE_DAY),
                countdownDate: new Date(FAKE_DAY * 24 * 60 * 60 * 1000),
            };
        })(),
        expectedCountdown: {
            hours: 0,
            minutes: 0,
            seconds: 0,
        },
        expectedCountdownString: "00:00:00",
    },
    {
        description: "Past the countdown",
        ...(() => {
            const FAKE_TIMESTAMP = 1650853878120;
            const FAKE_DAY = Math.floor(FAKE_TIMESTAMP / 1000 / 60 / 60 / 24);

            return {
                timestamp: FAKE_TIMESTAMP,
                ...getExpectedDateValues(FAKE_DAY),
                countdownDate: new Date(FAKE_DAY * 24 * 60 * 60 * 1000),
            };
        })(),
        expectedCountdown: {
            hours: 0,
            minutes: 0,
            seconds: 0,
        },
        expectedCountdownString: "00:00:00",
    },
];

fakeTimestamps.forEach((timestampInfo) => {
    describe(`datetime - ${timestampInfo.description}`, () => {
        beforeEach(() => {
            stubbedDateNow = sinon.stub(Date, "now").returns(timestampInfo.timestamp);
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should get the current day", () => {
            assert.strictEqual(getCurrentDay(), timestampInfo.expectedCurrentDay);
        });
        it("should get the next day", () => {
            assert.strictEqual(getNextDay(), timestampInfo.expectedNextDay);
        });
        it("should get the next Date", () => {
            assert.deepStrictEqual(getNextDate(), timestampInfo.expectedNextDate);
        });
        it("should get countdown to next day", () => {
            assert.deepStrictEqual(getCountdown(timestampInfo.countdownDate), {
                hours: timestampInfo.expectedCountdown.hours,
                minutes: timestampInfo.expectedCountdown.minutes,
                seconds: timestampInfo.expectedCountdown.seconds,
            });
        });
        it("should get countdown to next day in a formatted string", () => {
            assert.strictEqual(
                getCountdownString(timestampInfo.countdownDate),
                timestampInfo.expectedCountdownString
            );
        });
    });
});
