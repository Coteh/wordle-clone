const KEY_HOLD_TIMEOUT_MS = 500;

const renderInputRow = (parentElem, numberOfLetters) => {
    const container = document.createElement("div");
    container.className = "input-row";

    for (let i = 0; i < numberOfLetters; i++) {
        const box = document.createElement("div");
        box.classList.add("box");
        const letterElem = document.createElement("span");
        letterElem.classList.add("box-letter");
        box.appendChild(letterElem);
        container.appendChild(box);
    }

    parentElem.appendChild(container);

    return container;
};

const renderKeyboard = (parentElem, letterMap, handleKeyInput, handleHoldInput, gameState, keyboard) => {
    let rows;
    switch (keyboard) {
        case DVORAK_KEYBOARD:
            rows = [
                ["p", "y", "f", "g", "c", "r", "l", "backspace"],
                ["a", "o", "e", "u", "i", "d", "h", "t", "n", "s"],
                ["enter", "q", "j", "k", "x", "b", "m", "w", "v", "z"],
            ];
            break;
        case ALPHABETICAL_KEYBOARD:
            rows = [
                ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
                ["k", "l", "m", "n", "o", "p", "q", "r", "s"],
                ["enter", "t", "u", "v", "w", "x", "y", "z", "backspace"],
            ];
            break;
        default: // QWERTY_KEYBOARD
            rows = [
                ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
                ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
                ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
            ];
            break;
    }
    const bigKeys = ["enter", "backspace"];
    const container = document.createElement("div");
    container.id = "keyboard";
    container.classList.add("keyboard");

    let downTime, timeout;

    const handleMouseMove = (e) => {
        const pressedKey = document.querySelector(".keyboard-item[data-pressed='true']");
        if (!pressedKey) return;

        const rect = pressedKey.getBoundingClientRect();
        const { clientX, clientY } = e;

        // Check if the mouse position is outside the element's boundaries
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            pressedKey.classList.remove("pressed");
            pressedKey.classList.remove("held");
            pressedKey.classList.add(letterMap.get(pressedKey.innerText.toLowerCase()) || "standard");
            delete pressedKey.dataset.pressed;
            clearTimeout(timeout);
        }
    };

    document.addEventListener("mousemove", handleMouseMove);

    const handleTouchMove = (e) => {
        const pressedKey = document.querySelector(".keyboard-item[data-pressed='true']");
        if (!pressedKey) return;

        const rect = pressedKey.getBoundingClientRect();
        const { clientX, clientY } = e.touches[0];

        // Check if the touch position is outside the element's boundaries
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            pressedKey.classList.remove("pressed");
            pressedKey.classList.remove("held");
            pressedKey.classList.add(letterMap.get(pressedKey.innerText.toLowerCase()) || "standard");
            delete pressedKey.dataset.pressed;
            clearTimeout(timeout);
        }
    };

    document.addEventListener("touchmove", handleTouchMove);

    rows.forEach((row) => {
        const rowElem = document.createElement("div");
        rowElem.classList.add("keyboard-row");
        row.forEach((item) => {
            const letterStatus = letterMap.get(item);
            const itemElem = document.createElement("div");
            itemElem.classList.add("keyboard-item");
            if (bigKeys.includes(item)) {
                itemElem.classList.add("big");
            }
            itemElem.classList.add(letterStatus || "standard");
            itemElem.addEventListener("click", (e) => {
                e.preventDefault();
                handleKeyInput(item, false, false);
            });
            
            const handleDown = () => {
                if (gameState.ended) return;
                downTime = Date.now();
                itemElem.classList.remove(letterStatus || "standard");
                itemElem.classList.add("pressed");
                itemElem.dataset.pressed = "true";
                timeout = setTimeout(() => {
                    itemElem.classList.remove("pressed");
                    itemElem.classList.add("held");
                }, KEY_HOLD_TIMEOUT_MS);
            };
            const handleUp = () => {
                if (gameState.ended) return;
                if (Date.now() - downTime >= KEY_HOLD_TIMEOUT_MS) {
                    handleHoldInput(item);
                }
            };
            const handleRelease = () => {
                itemElem.classList.remove("pressed");
                itemElem.classList.remove("held");
                itemElem.classList.add(letterStatus || "standard");
                clearTimeout(timeout);
            };
            itemElem.addEventListener("touchstart", (e) => {
                e.preventDefault();
                handleDown();
            });
            itemElem.addEventListener("touchend", (e) => {
                e.preventDefault();
                handleUp();
                handleRelease();
                const rect = itemElem.getBoundingClientRect();
                const { clientX, clientY } = e.changedTouches[0];
                if (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                ) {
                    handleKeyInput(item, false, false);
                }
            });
            itemElem.addEventListener("touchcancel", (e) => {
                handleRelease();
            });
            itemElem.addEventListener("mousedown", (e) => {
                handleDown();
            });
            itemElem.addEventListener("mouseup", (e) => {
                handleUp();
                handleRelease();
            });
            const letterElem = document.createElement("div");
            letterElem.innerHTML =
                item === "backspace" ? `<i data-feather="delete"></i>` : item.toUpperCase();
            itemElem.appendChild(letterElem);
            rowElem.appendChild(itemElem);
        });
        container.appendChild(rowElem);
    });

    const prevKeyboard = parentElem.querySelector("#keyboard");
    if (prevKeyboard) {
        prevKeyboard.remove();
    }
    parentElem.appendChild(container);

    if (typeof feather !== "undefined") {
        feather.replace();
    } else {
        document.querySelector("[data-feather='delete']").innerText = "←";
    }

    return container;
};

const renderDialog = (content, options) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector(".dialog");
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector("#dialog");
    const clone = template.content.cloneNode(true);

    const dialog = clone.querySelector(".dialog");

    if (!('HTMLDialogElement' in window)) {
        console.warn("The <dialog> element is not supported in this browser. Applying polyfill...");
        dialogPolyfill.registerDialog(dialog);
    }

    const overlayBackElem = document.querySelector(".overlay-back");

    const dialogContent = clone.querySelector(".dialog-content");
    dialogContent.appendChild(content);

    if (options) {
        if (options.fadeIn) {
            dialog.style.opacity = "0";
            dialog.style.top = "100%";
            setTimeout(() => {
                const dialog = document.querySelector(".dialog");
                dialog.style.opacity = "";
                dialog.style.top = "";
            }, 10);
        }

        const closeBtn = clone.querySelector("button.close");
        if (options.closable || options.closable == null) {
            // Add a slight delay before adding the event listener to prevent the
            // dialog from closing immediately if enter key was pressed to open the dialog
            setTimeout(() => {
                closeBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    const dialog = document.querySelector(".dialog");
                    dialog.close();
                    dialog.remove();
                    overlayBackElem.style.display = "none";
                });
            });
        } else {
            closeBtn.style.display = "none";
        }

        if (options.style) {
            Object.assign(dialog.style, options.style);
        }
    }

    document.body.appendChild(clone);

    overlayBackElem.style.display = "block";

    if (typeof feather !== "undefined") {
        feather.replace();
    } else {
        document.querySelector(".dialog [data-feather='x']").innerText = "X";
    }

    dialog.show();
};

const renderNotification = (msg) => {
    const template = document.querySelector("#notification");
    const clone = template.content.cloneNode(true);

    const message = clone.querySelector(".notification-message");
    message.innerText = msg;

    const notificationArea = document.querySelector(".notification-area");
    notificationArea.appendChild(clone);

    // The original reference is a DocumentFragment, need to find the notification element in the DOM tree to continue using it
    const notificationList = notificationArea.querySelectorAll(
        ".notification-area > .notification"
    );
    const notification = notificationList[notificationList.length - 1];

    setTimeout(() => {
        notification.style.opacity = 0;

        setTimeout(() => {
            notification.remove();
        }, 1000);
    }, 1000);
};

const createDialogContentFromTemplate = (tmplContentId) => {
    const contentTmpl = document.querySelector(tmplContentId);
    const contentClone = contentTmpl.content.cloneNode(true);

    return contentClone;
};
