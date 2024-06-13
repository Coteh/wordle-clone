/// <reference types="cypress" />

const { replaceCRLFWithLF } = require("../../support/util");

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

describe("high contrast mode", () => {
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

    it("should be able to toggle the high contrast mode", () => {
        cy.get(".settings-link").click();

        cy.get("body").should("not.have.class", "high-contrast");

        cy.get(".setting.high-contrast").click();

        cy.get("body").should("have.class", "high-contrast");

        cy.get(".setting.high-contrast").click();

        cy.get("body").should("not.have.class", "high-contrast");
    });

    it("should set the high contrast mode on page reload if it's enabled in local storage", () => {
        cy.get("body").should("not.have.class", "high-contrast");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["high-contrast"]: "enabled",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("have.class", "high-contrast");
    });

    it("should not set the high contrast mode on page reload if it's disabled in local storage", () => {
        cy.get("body").should("not.have.class", "high-contrast");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["high-contrast"]: "disabled",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("not.have.class", "high-contrast");
    });

    it("should not set the high contrast mode if no entry exists in local storage for high contrast mode", () => {
        cy.get("body").should("not.have.class", "high-contrast");

        window.localStorage.removeItem("preferences");

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("not.have.class", "high-contrast");
    });

    it("should not set the high contrast mode if high contrast mode is set to invalid value in local storage", () => {
        cy.get("body").should("not.have.class", "high-contrast");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["high-contrast"]: "invalid",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get("body").should("not.have.class", "high-contrast");
    });

    it("should recolour the tiles and share feature as high contrast when high contrast is enabled", () => {
        cy.get(".help-link").click();

        cy.get(".sample > .box.within").should(
            "not.have.css",
            "background-color",
            "rgb(133, 192, 249)"
        );
        cy.get(".sample > .box.correct").should(
            "not.have.css",
            "background-color",
            "rgb(245, 121, 58)"
        );

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                ["high-contrast"]: "enabled",
            })
        );

        cy.reload();
        
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

        cy.waitForGameReady();

        cy.get(".help-link").click();

        cy.get(".sample > .box.within").should(
            "have.css",
            "background-color",
            "rgb(133, 192, 249)"
        );
        cy.get(".sample > .box.correct").should(
            "have.css",
            "background-color",
            "rgb(245, 121, 58)"
        );

        cy.get(".dialog > .close").click();

        const PREV_COPIED_TEXT =
            "This text should not be in clipboard when the copy button is clicked";

        cy.window().then(async (win) => {
            win.focus();
            await win.navigator.clipboard.writeText(PREV_COPIED_TEXT);
            const copiedText = await win.navigator.clipboard.readText();
            expect(replaceCRLFWithLF(copiedText)).to.eq(PREV_COPIED_TEXT);
        });

        const word = "leafy";

        cy.keyboardItem("g").click();
        cy.keyboardItem("l").click();
        cy.keyboardItem("i").click();
        cy.keyboardItem("d").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("enter").click();

        cy.inputRow(1).inputCell(2).should("have.css", "background-color", "rgb(133, 192, 249)");
        cy.keyboardItem("e").should("have.css", "background-color", "rgb(133, 192, 249)");

        for (let i = 0; i < word.length; i++) {
            cy.keyboardItem(word[i]).click();
        }
        cy.keyboardItem("enter").click();

        cy.inputRow(2).inputCell(2).should("have.css", "background-color", "rgb(245, 121, 58)");
        cy.keyboardItem("e").should("have.css", "background-color", "rgb(245, 121, 58)");

        cy.get(".share-button").should("have.css", "background-color", "rgb(245, 121, 58)").click();

        cy.window().then(async (win) => {
            const copiedText = await win.navigator.clipboard.readText();
            expect(replaceCRLFWithLF(copiedText)).to.eq(`Wordle Clone 1 2/6
⬛🟦⬛⬛🟦
🟧🟧🟧🟧🟧`);
        });
    });
});
