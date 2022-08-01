/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

const KEYS_ARR = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "enter",
    "backspace",
];

describe("viewport", () => {
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

    [
        {
            name: "small mobile device",
            width: 320,
            height: 480,
        },
        {
            name: "medium mobile device",
            width: 375,
            height: 667,
        },
        {
            name: "large mobile device",
            width: 375,
            height: 812,
        },
        {
            name: "huge mobile device",
            width: 428,
            height: 926,
        },
        {
            name: "tablet (portrait)",
            width: 768,
            height: 1024,
        },
        {
            name: "tablet (landscape)",
            width: 1024,
            height: 768,
        },
    ].forEach((def) => {
        it(`should be playable on a ${def.name}`, () => {
            cy.viewport(def.width, def.height);

            for (let i = 0; i < KEYS_ARR.length; i++) {
                cy.keyboardItem(KEYS_ARR[i]).shouldBeInViewport();
            }
            for (let i = 1; i <= 6; i++) {
                for (let j = 1; j <= 5; j++) {
                    cy.inputRow(i).inputCell(j).shouldBeInViewport();
                }
            }
            cy.contains("Wordle Clone").shouldBeInViewport();
            cy.get(".help-link").shouldBeInViewport();

            cy.keyboardItem("b").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("r").click();
            cy.keyboardItem("g").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("enter").click();

            cy.keyboardItem("t").click();
            cy.keyboardItem("o").click();
            cy.keyboardItem("o").click();
            cy.keyboardItem("backspace").click();
            cy.keyboardItem("backspace").click();
            cy.keyboardItem("backspace").click();
            cy.keyboardItem("l").click();
            cy.keyboardItem("e").click();
            cy.keyboardItem("a").click();
            cy.keyboardItem("f").click();
            cy.keyboardItem("y").click();
            cy.keyboardItem("enter").click();

            cy.task("log", "Checking dialog placement...");

            // The dialog should appear in center of screen after 0.5s because that's the duration of the CSS transition
            // TODO: Find a way to fix flake that occasionally happens when the dialog visibility check fails. Bumping the wait time by another 0.5s for now.
            // https://github.com/Coteh/wordle-clone/runs/7174612853?check_suite_focus=true
            cy.wait(1000);

            cy.contains("You win!").should("be.visible");
            cy.contains("Next Wordle").should("be.visible");

            cy.contains("You win!").shouldBeInViewport();
            cy.contains("Next Wordle").shouldBeInViewport();
        });
    });
});
