/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

const KEY_HOLD_TIMEOUT_MS = 500;

describe("keyboard", () => {
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

    it("should be able to select from any of the available keyboard", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");
        
        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "PYFGCRL");

        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "ABCDEFGHIJK");

        cy.get(".settings-link").click();

        cy.get(".setting.keyboard-switch").click();

        cy.get(".settings-link").click();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should set the Dvorak keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("not.contain.text", "PYFGCRL");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                "keyboard": "dvorak",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "PYFGCRL");
    });

    it("should set the alphabetical keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("not.contain.text", "ABCDEFGHIJK");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "alphabetical",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "ABCDEFGHIJK");
    });

    it("should set the QWERTY keyboard on page reload if it's enabled in local storage", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "qwerty",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should default to QWERTY keyboard if no entry exists in local storage for keyboard", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.removeItem("preferences");

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    it("should default to QWERTY keyboard if keyboard is set to invalid value in local storage", () => {
        cy.get(".keyboard").should("contain.text", "QWERTY");

        window.localStorage.setItem(
            "preferences",
            JSON.stringify({
                keyboard: "invalid",
            })
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get(".keyboard").should("contain.text", "QWERTY");
    });

    describe("keyboard key held state", () => {
        it("should remove pressed/held state and preserve key's original state when mouse is moved out of the key", () => {
            const checkKeyStates = (aOriginalState, sOriginalState) => {
                cy.keyboardItem("a").should("have.class", aOriginalState);
                cy.keyboardItem("s").should("have.class", sOriginalState);

                cy.keyboardItem("a").trigger("mousedown");
                cy.keyboardItem("a").should("have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");

                cy.keyboardItem("s").should("not.have.class", "pressed");
                cy.keyboardItem("s").should("not.have.class", "held");

                cy.keyboardItem("s").trigger("mousemove");
                cy.keyboardItem("a").should("not.have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("a").should("have.class", aOriginalState);
                cy.keyboardItem("s").should("not.have.class", "pressed");
                cy.keyboardItem("s").should("not.have.class", "held");
                cy.keyboardItem("s").should("have.class", sOriginalState);
                
                cy.keyboardItem("a").trigger("mouseup");
                cy.keyboardItem("a").should("not.have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("a").should("have.class", aOriginalState);
                cy.keyboardItem("s").should("not.have.class", "pressed");
                cy.keyboardItem("s").should("not.have.class", "held");
                cy.keyboardItem("s").should("have.class", sOriginalState);

                cy.keyboardItem("d").trigger("mousemove");
                cy.wait(KEY_HOLD_TIMEOUT_MS);

                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("s").should("not.have.class", "held");
            };

            checkKeyStates("standard", "standard");

            cy.keyboardItem("l").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("s").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("enter").click();

            checkKeyStates("correct", "incorrect");
        });

        it("should restore the letter status of the key when touch is moved outside the key element", () => {
            const checkKeyState = (originalState) => {
                cy.keyboardItem("a").trigger("touchstart", {
                    touches: [{ clientX: 50, clientY: 50 }],
                    changedTouches: [{ clientX: 50, clientY: 50 }]
                });
                cy.keyboardItem("a").should("have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("a").should("not.have.class", originalState);

                cy.keyboardItem("b").trigger("touchmove", {
                    touches: [{ clientX: 50, clientY: 50 }],
                    changedTouches: [{ clientX: 50, clientY: 50 }]
                });
                cy.keyboardItem("a").should("not.have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("a").should("have.class", originalState);

                cy.keyboardItem("a").trigger("touchend", {
                    touches: [{ clientX: 50, clientY: 50 }],
                    changedTouches: [{ clientX: 50, clientY: 50 }]
                });
                cy.keyboardItem("a").should("not.have.class", "pressed");
                cy.keyboardItem("a").should("not.have.class", "held");
                cy.keyboardItem("a").should("have.class", originalState);
            };

            checkKeyState("standard");
            
            cy.keyboardItem("l").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("s").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("enter").click();
            
            checkKeyState("correct");
        });

        it("should not type the letter when touch is released outside the key element", () => {
            cy.viewport('iphone-6');

            cy.keyboardItem("a").trigger("touchstart", {
                touches: [{ clientX: 50, clientY: 50 }],
                changedTouches: [{ clientX: 50, clientY: 50 }]
            });

            cy.get("body").trigger("touchmove", {
                touches: [{ clientX: 0, clientY: 0 }],
                changedTouches: [{ clientX: 0, clientY: 0 }]
            });

            cy.keyboardItem("a").trigger("touchend", {
                touches: [{ clientX: 0, clientY: 0 }],
                changedTouches: [{ clientX: 0, clientY: 0 }]
            });

            cy.get(".input-row .box-letter").should("not.contain.text", "a");
        });
    });
});
