/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

// NOTE: If viewing this set of tests on Cypress UI, make sure the browser is active and you've allowed clipboard access when prompted
describe("sharing results", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
            },
        });
        cy.waitForGameReady();
    });

    const performAction = (word) => {
        cy.keyboardItem("g").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("d").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("enter").click();

        for (let i = 0; i < word.length; i++) {
            cy.keyboardItem(word[i]).click();
        }
        cy.keyboardItem("enter").click();

        cy.get(".share-button").click();
    };

    it("should copy the results to clipboard when share button is pressed", () => {
        const PREV_COPIED_TEXT =
            "This text should not be in clipboard when the copy button is clicked";

        cy.window().then(async (win) => {
            win.focus();
            await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(PREV_COPIED_TEXT);
        });

        performAction("leafy");

        cy.window().then(async (win) => {
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
        });
    });

    // NOTE: This test and the one after it have flaked before
    // https://github.com/Coteh/wordle-clone/actions/runs/3864885869/jobs/6588015395
    // TODO: If it happens again, or if it happens more often, look into a fix.
    it("should show a message when results have been copied", () => {
        performAction("leafy");

        cy.contains("Copied to clipboard").should("be.visible");
    });

    it("should handle copy failure", () => {
        const PREV_COPIED_TEXT = "This text should still be copied after failure to copy";

        cy.window().then(async (win) => {
            win.focus();
            await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(PREV_COPIED_TEXT);
            win.navigator.clipboard.writeText = cy.stub().rejects(new Error("Error copying"));
        });

        performAction("leafy");

        cy.contains("Could not copy to clipboard due to error").should("be.visible");

        cy.window().then(async (win) => {
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(PREV_COPIED_TEXT);
        });
    });

    describe("day number", () => {
        it("should handle any day number after March 23 2022", () => {
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-30T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.reload();
            cy.waitForGameReady();

            performAction("chief");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(`Wordle Clone 7 2/6
⬛⬛🟩⬛🟨
🟩🟩🟩🟩🟩`);
            });

            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-07-01T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.reload();
            cy.waitForGameReady();

            performAction("urban");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(`Wordle Clone 100 2/6
⬛⬛⬛⬛⬛
🟩🟩🟩🟩🟩`);
            });
        });

        it("should handle day number on March 23 2022", () => {
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-23T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.reload();
            cy.waitForGameReady();

            performAction("plait");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(`Wordle Clone 0 2/6
⬛🟩🟨⬛⬛
🟩🟩🟩🟩🟩`);
            });
        });

        it("should handle any day number before March 23 2022", () => {
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-18T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.reload();
            cy.waitForGameReady();

            performAction("buffs");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(`Wordle Clone -5 2/6
⬛⬛⬛⬛⬛
🟩🟩🟩🟩🟩`);
            });

            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-22T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.reload();
            cy.waitForGameReady();

            performAction("toots");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(`Wordle Clone -1 2/6
⬛⬛⬛⬛⬛
🟩🟩🟩🟩🟩`);
            });
        });
    });

    it("should add asterisk if hard mode is enabled", () => {
        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["hard-mode"]: "enabled",
            })
        );

        cy.reload();

        const PREV_COPIED_TEXT =
            "This text should not be in clipboard when the copy button is clicked";

        cy.window().then(async (win) => {
            win.focus();
            await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(PREV_COPIED_TEXT);
        });

        performAction("leafy");

        cy.window().then(async (win) => {
            const copiedText = await win.navigator.clipboard.readText();
            expect(copiedText).to.eq(`Wordle Clone 1 2/6*
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
        });
    });
});
