const getCurrentDay = () => Math.floor(Date.now() / 1000 / 60 / 60 / 24);

const getNextDay = () => Math.ceil(Date.now() / 1000 / 60 / 60 / 24);

const getNextDate = () => new Date(getNextDay() * 24 * 60 * 60 * 1000);

const getCountdown = (nextDate) => {
    const currDate = new Date(Date.now());
    const seconds = (nextDate - currDate) / 1000;
    const hours = seconds / 3600;
    const minutes = (seconds % 3600) / 60;
    const leftoverSeconds = (seconds % 3600) % 60;

    return {
        hours: Math.max(Math.floor(hours), 0),
        minutes: Math.max(Math.floor(minutes), 0),
        seconds: Math.max(Math.floor(leftoverSeconds), 0),
    };
};

const getCountdownString = (nextDate) => {
    const countdown = getCountdown(nextDate);
    return `${countdown.hours.toString().padStart(2, "0")}:${countdown.minutes
        .toString()
        .padStart(2, "0")}:${countdown.seconds.toString().padStart(2, "0")}`;
};

if (typeof process !== "undefined") {
    module.exports = {
        getCurrentDay,
        getNextDay,
        getNextDate,
        getCountdown,
        getCountdownString,
    };
}
