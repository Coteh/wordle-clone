/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;
const FIRST_DAY = 19074;

const MIGRATION_DIALOG_TEXT = "Your save data has been migrated";

const ATTEMPTS = JSON.stringify([
    [
        { letter: "a", correct: false, within: true },
        { letter: "l", correct: false, within: true },
        { letter: "p", correct: false, within: false },
        { letter: "h", correct: false, within: false },
        { letter: "a", correct: false, within: false },
    ],
]);

describe("localStorage migration", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS + DAY_MS / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
    });

    describe("full migration", () => {
        it("should display migration dialog when all legacy keys are migrated, and close when OK button is clicked", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "dark" }));
                    win.localStorage.setItem("attempts", ATTEMPTS);
                    win.localStorage.setItem("lives", "4");
                    win.localStorage.setItem("day", String(FIRST_DAY + 1));
                    win.localStorage.setItem("ended", "false");
                    win.localStorage.setItem("won_hard_mode", "false");
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("be.visible");
            cy.contains("email").should("be.visible");
            cy.get(".dialog .ok").click();
            cy.get(".dialog").should("not.exist");
        });

        it("should migrate game state to new keys when legacy day is current", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("attempts", ATTEMPTS);
                    win.localStorage.setItem("lives", "4");
                    win.localStorage.setItem("day", String(FIRST_DAY + 1));
                    win.localStorage.setItem("ended", "false");
                    win.localStorage.setItem("won_hard_mode", "false");
                },
            });
            cy.waitForGameReady();

            cy.window().then((win) => {
                expect(win.localStorage.getItem("wc_lives")).to.equal("4");
                expect(win.localStorage.getItem("wc_day")).to.equal(String(FIRST_DAY + 1));
                expect(win.localStorage.getItem("wc_ended")).to.equal("false");
                expect(win.localStorage.getItem("wc_won_hard_mode")).to.equal("false");
                expect(win.localStorage.getItem("wc_played_before")).to.equal("true");
            });
        });

        it("should migrate preference keys to new keys", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "dark" }));
                },
            });
            cy.waitForGameReady();

            cy.window().then((win) => {
                expect(win.localStorage.getItem("wc_played_before")).to.equal("true");
                expect(win.localStorage.getItem("wc_preferences")).to.equal(
                    JSON.stringify({ theme: "dark" })
                );
            });
        });
    });

    describe("no migration", () => {
        it("should not display migration dialog when no legacy keys exist", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", "true");
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("not.exist");
        });

        it("should not display migration dialog when all new keys already exist", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    // Set both legacy and new keys
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "light" }));
                    win.localStorage.setItem("wc_played_before", "true");
                    win.localStorage.setItem(
                        "wc_preferences",
                        JSON.stringify({ theme: "dark" })
                    );
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("not.exist");
        });

        it("should not overwrite existing new keys during migration", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "light" }));
                    win.localStorage.setItem(
                        "wc_preferences",
                        JSON.stringify({ theme: "dark" })
                    );
                    win.localStorage.setItem("wc_played_before", "true");
                },
            });
            cy.waitForGameReady();

            cy.window().then((win) => {
                // The existing new key should NOT be overwritten
                expect(win.localStorage.getItem("wc_preferences")).to.equal(
                    JSON.stringify({ theme: "dark" })
                );
            });
        });
    });

    describe("partial migration", () => {
        it("should display migration dialog when only some legacy keys are migrated", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    // Legacy keys present
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "dark" }));
                    // Some new keys already present
                    win.localStorage.setItem("wc_played_before", "true");
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("be.visible");
        });

        it("should not migrate game state keys but still migrate preference keys when legacy day is outdated", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("played_before", "true");
                    win.localStorage.setItem("preferences", JSON.stringify({ theme: "dark" }));
                    // Stale game state
                    win.localStorage.setItem("day", String(FIRST_DAY));
                    win.localStorage.setItem("attempts", ATTEMPTS);
                    win.localStorage.setItem("lives", "4");
                    win.localStorage.setItem("ended", "false");
                    win.localStorage.setItem("won_hard_mode", "false");
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("be.visible");

            cy.window().then((win) => {
                // Preference keys should be migrated
                expect(win.localStorage.getItem("wc_played_before")).to.equal("true");
                expect(win.localStorage.getItem("wc_preferences")).to.equal(
                    JSON.stringify({ theme: "dark" })
                );
                // Game state should NOT be migrated due to stale day
                expect(win.localStorage.getItem("wc_attempts")).to.be.null;
                expect(win.localStorage.getItem("wc_lives")).to.be.null;
                expect(win.localStorage.getItem("wc_day")).to.be.null;
                expect(win.localStorage.getItem("wc_ended")).to.be.null;
                expect(win.localStorage.getItem("wc_won_hard_mode")).to.be.null;
            });
        });
    });

    describe("error handling", () => {
        it("should not display migration dialog when localStorage throws an error", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", "true");
                    // Stub getItem to throw an error to simulate access restriction
                    const origGetItem = win.localStorage.getItem.bind(win.localStorage);
                    cy.stub(win.localStorage, "getItem").callsFake((key) => {
                        if (!key.startsWith("wc_")) {
                            throw new Error("localStorage access denied");
                        }
                        return origGetItem(key);
                    });
                },
            });
            cy.waitForGameReady();

            cy.contains(MIGRATION_DIALOG_TEXT).should("not.exist");

            cy.window().then((win) => {
                // Verify that existing wc_ prefixed entries were not overwritten
                expect(win.localStorage.getItem("wc_played_before")).to.equal("true");
            });
        });
    });
});
