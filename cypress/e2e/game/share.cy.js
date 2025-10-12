/// <reference types="cypress" />

import { version } from "../../../package.json";

const { replaceCRLFWithLF } = require("../../support/util");

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

// NOTE: If viewing this set of tests on Cypress UI, make sure the browser is active and you've allowed clipboard access when prompted
describe("sharing results", () => {
    beforeEach(() => {
        cy.grantClipboardPermission();
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS * 1 + (DAY_MS * 1) / 2, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.clearServiceWorkerCaches();
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("played_before", true);
                window.localStorage.setItem("last_version", version);
            },
        });
        cy.waitForGameReady();
    });

    const performWordSubmissions = (secondWord) => {
        cy.keyboardItem("g").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("d").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("enter").click();

        for (let i = 0; i < secondWord.length; i++) {
            cy.keyboardItem(secondWord[i]).click();
        }
        cy.keyboardItem("enter").click();
    };

    const stubShare = () => {
        cy.window().then((win) => {
            // Return false so that it will fallback to clipboard option
            const canShareFunc = (data) => false;
            // Create the property for canShare if it doesn't exist (ie. browser does not support share sheet), otherwise stub directly
            if (!win.navigator.canShare) {
                Object.defineProperty(win.navigator, 'canShare', {
                    value: cy.stub().callsFake(canShareFunc),
                    writable: true,
                    configurable: true
                });
            } else {
                cy.stub(win.navigator, 'canShare').callsFake(canShareFunc);
            }
        });
    };

    // NOTE: Actual share sheet is mocked out for these tests
    describe("share sheet method", () => {
        it("sends data to share sheet", () => {
            const PREV_COPIED_TEXT =
                "This data should still be in clipboard when share is clicked";
            let shareStub;

            cy.window().then(async (win) => {
                // Create the property for canShare if it doesn't exist
                if (!win.navigator.canShare) {
                    Object.defineProperty(win.navigator, 'canShare', {
                        value: cy.stub().callsFake((data) => true),
                        writable: true,
                        configurable: true
                    });
                }
                // Define share function as a stub if it's a browser that doesn't support it normally, otherwise stub it directly
                if (!win.navigator.share) {
                    shareStub = cy.stub().resolves();
                    Object.defineProperty(win.navigator, 'share', {
                        value: shareStub,
                        writable: true,
                        configurable: true
                    });
                } else {
                    shareStub = cy.stub(win.navigator, 'share').resolves();
                }

                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");

            cy.get(".share-button").click().then(() => {
                expect(shareStub).to.be.calledOnce;
                expect(shareStub).to.be.calledWithExactly({
                    text: `Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`,
                });
            });

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });
        });

        it("does not copy to clipboard when cancelled", () => {
            const PREV_COPIED_TEXT =
                "This data should still be in clipboard when share is clicked";

            cy.window().then(async (win) => {
                // Create the property for canShare if it doesn't exist
                if (!win.navigator.canShare) {
                    Object.defineProperty(win.navigator, 'canShare', {
                        value: cy.stub().callsFake((data) => true),
                        writable: true,
                        configurable: true
                    });
                }
                const shareFunc = (data) => {
                    console.log('Shared data:', data);
                    // Return a Promise to simulate cancelling share operation
                    return Promise.reject(new DOMException("Share canceled", "AbortError"));
                };
                // Define share function as a stub if it's a browser that doesn't support it normally, otherwise stub it directly
                if (!win.navigator.share) {
                    Object.defineProperty(win.navigator, 'share', {
                        value: cy.stub().callsFake(shareFunc),
                        writable: true,
                        configurable: true
                    });
                } else {
                    cy.stub(win.navigator, 'share').callsFake(shareFunc);
                }

                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            cy.contains("Copy to Clipboard").should("not.be.visible");
        });

        it("copies to clipboard automatically when share sheet fails due to permission issue", () => {
            const PREV_COPIED_TEXT =
                "This data should still be in clipboard when share is clicked";

            cy.window().then(async (win) => {
                // Create the property for canShare if it doesn't exist
                if (!win.navigator.canShare) {
                    Object.defineProperty(win.navigator, 'canShare', {
                        value: cy.stub().callsFake((data) => true),
                        writable: true,
                        configurable: true
                    });
                }
                const shareFunc = (data) => {
                    console.log('Shared data:', data);
                    // Return a Promise to simulate permission issue
                    return Promise.reject(new DOMException("User or app denied permission", "NotAllowedError"));
                };
                // Define share function as a stub if it's a browser that doesn't support it normally, otherwise stub it directly
                if (!win.navigator.share) {
                    Object.defineProperty(win.navigator, 'share', {
                        value: cy.stub().callsFake(shareFunc),
                        writable: true,
                        configurable: true
                    });
                } else {
                    cy.stub(win.navigator, 'share').callsFake(shareFunc);
                }

                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });

            cy.contains("Copy to Clipboard").should("not.be.visible");
        });

        it("does not copy to clipboard automatically and instead displays error message when share sheet fails due to unknown error", () => {
            const PREV_COPIED_TEXT =
                "This data should still be in clipboard when share is clicked";

            cy.window().then(async (win) => {
                // Create the property for canShare if it doesn't exist
                if (!win.navigator.canShare) {
                    Object.defineProperty(win.navigator, 'canShare', {
                        value: cy.stub().callsFake((data) => true),
                        writable: true,
                        configurable: true
                    });
                }
                const shareFunc = (data) => {
                    console.log('Shared data:', data);
                    // Return a Promise to simulate unknown error
                    return Promise.reject(new DOMException("Unknown error", "UnknownError"));
                };
                // Define share function as a stub if it's a browser that doesn't support it normally, otherwise stub it directly
                if (!win.navigator.share) {
                    Object.defineProperty(win.navigator, 'share', {
                        value: cy.stub().callsFake(shareFunc),
                        writable: true,
                        configurable: true
                    });
                } else {
                    cy.stub(win.navigator, 'share').callsFake(shareFunc);
                }

                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.contains("Could not share due to error").should("be.visible");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            cy.contains("Copy to Clipboard").should("be.visible").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });
        });

        it("copies to clipboard automatically if browser cannot validate data to be shared", () => {
            const PREV_COPIED_TEXT =
                "This data should still be in clipboard when share is clicked";

            cy.window().then(async (win) => {
                const canShareFunc = (data) => {
                    console.log('Shared data to be validated:', data);
                    // Return false to indicate that sharing cannot be done due to invalid data
                    return false;
                };
                // Define canShare function as a stub if it's a browser that doesn't support it normally, otherwise stub it directly
                if (!win.navigator.canShare) {
                    Object.defineProperty(win.navigator, 'canShare', {
                        value: cy.stub().callsFake(canShareFunc),
                        writable: true,
                        configurable: true
                    });
                } else {
                    cy.stub(win.navigator, 'canShare').callsFake(canShareFunc);
                }

                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });

            cy.contains("Copy to Clipboard").should("not.be.visible");
        });
    });

    describe("clipboard fallback method", () => {
        beforeEach(() => {
            stubShare();
        });

        it("should copy the results to clipboard when share button is pressed", () => {
            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(copiedText).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });
        });

        // NOTE: This test and the one after it have flaked before
        // https://github.com/Coteh/wordle-clone/actions/runs/3864885869/jobs/6588015395
        // TODO: If it happens again, or if it happens more often, look into a fix.
        it("should show a message when results have been copied", () => {
            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.contains("Copied to clipboard").should("be.visible");
        });

        it("should handle copy failure", () => {
            const PREV_COPIED_TEXT = "This text should still be copied after failure to copy";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
                win.navigator.clipboard.writeText = cy.stub().rejects(new Error("Error copying"));
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.contains("Could not copy to clipboard due to error").should("be.visible");

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });
        });

        it("should add asterisk if hard mode is enabled", () => {
            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            ["hard-mode"]: "enabled",
                        })
                    );
                },
            });

            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6*
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });
        });

        it("should not add asterisk if hard mode is enabled after ending the game on easy", () => {
            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            ["hard-mode"]: "enabled",
                        })
                    );
                },
            });

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });
        });

        it("should keep asterisk if hard mode is disabled after ending the game on hard", () => {
            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            ["hard-mode"]: "enabled",
                        })
                    );
                },
            });

            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });

            performWordSubmissions("leafy");
            cy.get(".share-button").click();

            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            ["hard-mode"]: "disabled",
                        })
                    );
                },
            });

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6*
⬛🟨⬛⬛🟨
🟩🟩🟩🟩🟩`);
            });
        });

        it("should allow player to share an incomplete game", () => {
            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });

            for (let i = 0; i < 6; i++) {
                cy.keyboardItem("b").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("r").click();
                cy.keyboardItem("g").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();
            }
            cy.contains("You lose!").should("be.visible");
            cy.contains("word was leafy").should("be.visible");

            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 X/6
⬛🟨⬛⬛🟨
⬛🟨⬛⬛🟨
⬛🟨⬛⬛🟨
⬛🟨⬛⬛🟨
⬛🟨⬛⬛🟨
⬛🟨⬛⬛🟨`);
            });
        });

        it("should allow player to share an incomplete game with hard mode and high contrast enabled", () => {
            cy.visit("/", {
                onBeforeLoad: () => {
                    window.localStorage.setItem(
                        "preferences",
                        JSON.stringify({
                            ["hard-mode"]: "enabled",
                            ["high-contrast"]: "enabled",
                        })
                    );
                },
            });

            const PREV_COPIED_TEXT =
                "This text should not be in clipboard when the copy button is clicked";

            cy.window().then(async (win) => {
                win.focus();
                await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
            });

            for (let i = 0; i < 6; i++) {
                cy.keyboardItem("b").click();
                cy.keyboardItem("a").click();
                cy.keyboardItem("r").click();
                cy.keyboardItem("g").click();
                cy.keyboardItem("e").click();
                cy.keyboardItem("enter").click();
            }
            cy.contains("You lose!").should("be.visible");
            cy.contains("word was leafy").should("be.visible");

            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 X/6*
⬛🟦⬛⬛🟦
⬛🟦⬛⬛🟦
⬛🟦⬛⬛🟦
⬛🟦⬛⬛🟦
⬛🟦⬛⬛🟦
⬛🟦⬛⬛🟦`);
            });
        });
    });

    describe.skip("legacy clipboard fallback method", () => {
        it("should copy the results to clipboard when share button is pressed", () => {
            throw new Error("TODO: implement this test");
        });

        it("should show a message when results have been copied", () => {
            throw new Error("TODO: implement this test");
        });

        it("should handle copy failure", () => {
            throw new Error("TODO: implement this test");
        });
    });

    describe("day number", () => {
        it("should handle any day number after March 23 2022", () => {
            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-30T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.clearServiceWorkerCaches();
            cy.reload();
            stubShare();
            cy.waitForGameReady();

            performWordSubmissions("chief");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                win.focus();
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 7 2/6
⬛⬛🟩⬛🟨
🟩🟩🟩🟩🟩`);
            });

            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-07-01T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.clearServiceWorkerCaches();
            cy.reload();
            stubShare();
            cy.waitForGameReady();

            performWordSubmissions("urban");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 100 2/6
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
            cy.clearServiceWorkerCaches();
            cy.reload();
            stubShare();
            cy.waitForGameReady();

            performWordSubmissions("plait");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                win.focus();
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 0 2/6
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
            cy.clearServiceWorkerCaches();
            cy.reload();
            stubShare();
            cy.waitForGameReady();

            performWordSubmissions("buffs");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                win.focus();
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone -5 2/6
⬛⬛⬛⬛⬛
🟩🟩🟩🟩🟩`);
            });

            cy.clock().then((clock) => {
                clock.restore();
            });
            cy.clock(new Date("2022-03-22T00:00:00.000Z"), ["Date"]);
            cy.clearBrowserCache();
            cy.clearServiceWorkerCaches();
            cy.reload();
            stubShare();
            cy.waitForGameReady();

            performWordSubmissions("toots");
            cy.get(".share-button").click();

            cy.window().then(async (win) => {
                const copiedText = await win.navigator.clipboard.readText();
                expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone -1 2/6
⬛⬛⬛⬛⬛
🟩🟩🟩🟩🟩`);
            });
        });
    });
});
