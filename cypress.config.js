const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
    screenshotOnRunFailure: process.env.CI === undefined,
    video: process.env.CI === undefined,
});
