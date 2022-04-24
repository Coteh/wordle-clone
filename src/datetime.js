const getCurrentDay = () => Math.floor(Date.now() / 1000 / 60 / 60 / 24);

const getNextDay = () => Math.ceil(Date.now() / 1000 / 60 / 60 / 24);

const getNextDate = () => new Date(getNextDay() * 24 * 60 * 60 * 1000);

const getCountdownToNextDay = () => {
    const nextDate = getNextDate();
    const currDate = new Date(Date.now());
    const seconds = (nextDate - currDate) / 1000;
    const hours = seconds / 3600;
    const minutes = (seconds % 3600) / 60;
    const leftoverSeconds = (seconds % 3600) % 60;

    return {
        hours: Math.floor(hours),
        minutes: Math.floor(minutes),
        seconds: Math.floor(leftoverSeconds),
    };
};

const getCountdownToNextDayString = () => {
    const countdown = getCountdownToNextDay();
    return `${countdown.hours.toString().padStart(2, "0")}:${countdown.minutes
        .toString()
        .padStart(2, "0")}:${countdown.seconds.toString().padStart(2, "0")}`;
};

if (typeof process !== "undefined") {
    module.exports = {
        getCurrentDay,
        getNextDay,
        getNextDate,
        getCountdownToNextDay,
        getCountdownToNextDayString,
    };
}
