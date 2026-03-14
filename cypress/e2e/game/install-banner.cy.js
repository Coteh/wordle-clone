/// <reference types="cypress" />

const DAY_MS = 86400000;
// March 23 2022 - initial release date
const FIRST_DAY_MS = 1647993600000;

const IOS_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";

const INSTALL_DISMISSED_KEY = "wc_install_dismissed";

// Timeout to account for the 1.5s delay before the banner slides up
const BANNER_APPEAR_TIMEOUT = 3000;

const fireInstallPromptEvent = () => {
    cy.window().then((win) => {
        const event = new Event("beforeinstallprompt");
        event.preventDefault = cy.stub();
        event.prompt = cy.stub().resolves({ outcome: "dismissed" });
        event.userChoice = Promise.resolve({ outcome: "dismissed" });
        win.dispatchEvent(event);
    });
};

describe("install banner", () => {
    beforeEach(() => {
        // only mock the "Date" object, otherwise events that use setTimeout like dialog messages won't work
        // https://github.com/cypress-io/cypress/issues/7455#issuecomment-635278631
        cy.clock(FIRST_DAY_MS + DAY_MS, ["Date"]);
        cy.intercept("/words.txt", {
            fixture: "words.txt",
        });
        cy.clearBrowserCache();
        cy.visit("/", {
            onBeforeLoad: () => {
                window.localStorage.setItem("wc_played_before", true);
            },
        });
        cy.waitForGameReady();
    });

    it("should not be visible before beforeinstallprompt fires", () => {
        cy.get("#install-banner").should("not.be.visible");
    });

    describe("after install prompt event fires", () => {
        beforeEach(() => {
            fireInstallPromptEvent();
        });

        it("should appear after delay", () => {
            cy.get("#install-banner", { timeout: BANNER_APPEAR_TIMEOUT }).should(
                "be.visible"
            );
        });

        it("should show the install button", () => {
            cy.get("#install-banner", { timeout: BANNER_APPEAR_TIMEOUT }).should(
                "be.visible"
            );
            cy.get("#install-btn").should("be.visible");
        });

        describe("dismissing permanently with X button", () => {
            beforeEach(() => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("#install-dismiss").click();
            });

            it("should hide the banner", () => {
                cy.get("#install-banner").should("not.be.visible");
            });

            it("should save the dismissal to localStorage", () => {
                cy.window().then((win) => {
                    expect(
                        win.localStorage.getItem(INSTALL_DISMISSED_KEY)
                    ).to.equal("1");
                });
            });

            it("should not reappear on reload", () => {
                cy.reload();
                cy.waitForGameReady();
                // Listener is never registered after reload because DISMISSED_KEY is set,
                // so firing the event has no effect
                fireInstallPromptEvent();
                cy.get("#install-banner").should("not.be.visible");
            });
        });

        describe("closing temporarily by clicking outside", () => {
            beforeEach(() => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("body").click({ position: "top" });
            });

            it("should hide the banner", () => {
                cy.get("#install-banner").should("not.be.visible");
            });

            it("should not save anything to localStorage", () => {
                cy.window().then((win) => {
                    expect(win.localStorage.getItem(INSTALL_DISMISSED_KEY)).to.be
                        .null;
                });
            });

            it("should reappear on reload", () => {
                cy.reload();
                cy.waitForGameReady();
                fireInstallPromptEvent();
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
            });
        });

        describe("closing temporarily by tapping a keyboard key", () => {
            beforeEach(() => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                // Keyboard keys call e.preventDefault() on touchstart, which suppresses
                // the synthetic click event on mobile — the banner must also listen for
                // touchstart on the document, not just click.
                cy.keyboardItem("a").trigger("touchstart");
            });

            it("should hide the banner", () => {
                cy.get("#install-banner").should("not.be.visible");
            });

            it("should not save anything to localStorage", () => {
                cy.window().then((win) => {
                    expect(win.localStorage.getItem(INSTALL_DISMISSED_KEY)).to.be
                        .null;
                });
            });

            it("should not register the key tap as game input", () => {
                cy.inputRowShouldBeEmpty(1);
            });
        });

        describe("overlay blocking game input while banner is visible", () => {
            it("should be present while the banner is visible", () => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("#install-banner-overlay").should("be.visible");
            });

            it("should be removed once the banner is hidden", () => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("#install-dismiss").click();
                cy.get("#install-banner-overlay").should("not.be.visible");
            });
        });
    });

    describe("when already permanently dismissed", () => {
        it("should not appear even after beforeinstallprompt fires", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", true);
                    win.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
                },
            });
            cy.waitForGameReady();
            // Listener is never registered because DISMISSED_KEY is already set
            fireInstallPromptEvent();
            cy.get("#install-banner").should("not.be.visible");
        });
    });

    describe("when app is already running in standalone mode", () => {
        it("should not appear", () => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", true);
                    cy.stub(win, "matchMedia").callsFake((query) => ({
                        matches: query === "(display-mode: standalone)",
                        media: query,
                        onchange: null,
                        addListener: cy.stub(),
                        removeListener: cy.stub(),
                        addEventListener: cy.stub(),
                        removeEventListener: cy.stub(),
                        dispatchEvent: cy.stub(),
                    }));
                },
            });
            cy.waitForGameReady();
            fireInstallPromptEvent();
            cy.get("#install-banner").should("not.be.visible");
        });
    });

    describe("on iOS", () => {
        beforeEach(() => {
            cy.visit("/", {
                onBeforeLoad: (win) => {
                    win.localStorage.setItem("wc_played_before", true);
                    Object.defineProperty(win.navigator, "userAgent", {
                        value: IOS_USER_AGENT,
                        configurable: true,
                    });
                },
            });
            cy.waitForGameReady();
        });

        it("should appear automatically after delay without beforeinstallprompt", () => {
            cy.get("#install-banner", { timeout: BANNER_APPEAR_TIMEOUT }).should(
                "be.visible"
            );
        });

        it("should not show the install button", () => {
            cy.get("#install-banner", { timeout: BANNER_APPEAR_TIMEOUT }).should(
                "be.visible"
            );
            cy.get("#install-btn").should("not.be.visible");
        });

        it("should show the share sheet instruction", () => {
            cy.get("#install-banner", { timeout: BANNER_APPEAR_TIMEOUT }).should(
                "be.visible"
            );
            cy.get(".install-banner-ios").should("be.visible");
            cy.get(".install-banner-ios").should("contain.text", "Add to Home Screen");
        });

        describe("dismissing permanently with X button", () => {
            beforeEach(() => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("#install-dismiss").click();
            });

            it("should hide the banner", () => {
                cy.get("#install-banner").should("not.be.visible");
            });

            it("should save the dismissal to localStorage", () => {
                cy.window().then((win) => {
                    expect(
                        win.localStorage.getItem(INSTALL_DISMISSED_KEY)
                    ).to.equal("1");
                });
            });
        });

        describe("closing temporarily by clicking outside", () => {
            beforeEach(() => {
                cy.get("#install-banner", {
                    timeout: BANNER_APPEAR_TIMEOUT,
                }).should("be.visible");
                cy.get("body").click({ position: "top" });
            });

            it("should hide the banner", () => {
                cy.get("#install-banner").should("not.be.visible");
            });

            it("should not save anything to localStorage", () => {
                cy.window().then((win) => {
                    expect(win.localStorage.getItem(INSTALL_DISMISSED_KEY)).to.be
                        .null;
                });
            });
        });
    });
});
