const DAY_MS = 86400000;
const FIRST_DAY_MS = 1647993600000;

describe("offline support", () => {
    beforeEach(() => {
        cy.goOnline();
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
            },
        });
        cy.waitForGameReady();
    });
    afterEach(() => {
        cy.goOnline();
        cy.clearServiceWorkers();
    });

    it("can allow the game to be played offline", () => {
        cy.goOffline();
        cy.reload();

        cy.waitForGameReady();

        cy.keyboardItem("l").click();
        cy.keyboardItem("e").click();
        cy.keyboardItem("a").click();
        cy.keyboardItem("f").click();
        cy.keyboardItem("y").click();

        cy.keyboardItem("enter").click();

        cy.contains("You win!").should("be.visible");
    });
});
