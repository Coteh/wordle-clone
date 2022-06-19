const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here

            // Log messages in command line output using Node.js runner
            // Adapted from https://stackoverflow.com/a/67533232
            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                },
            });
        },
    },
    screenshotOnRunFailure: process.env.CI === undefined,
    video: process.env.CI === undefined,
});
