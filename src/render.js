let notificationTimeout;

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

const renderKeyboard = (parentElem, letterMap, handleKeyInput, handleHoldInput, gameState) => {
    const rows = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
    ];
    const bigKeys = ["enter", "backspace"];
    const container = document.createElement("div");
    container.id = "keyboard";
    container.classList.add("keyboard");

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
                handleKeyInput(item);
            });
            let downTime, timeout;
            const handleDown = () => {
                if (gameState.ended) return;
                downTime = Date.now();
                itemElem.classList.remove(letterStatus || "standard");
                itemElem.classList.add("pressed");
                timeout = setTimeout(() => {
                    itemElem.classList.remove("pressed");
                    itemElem.classList.add("held");
                }, 500);
            };
            const handleUp = () => {
                if (gameState.ended) return;
                if (Date.now() - downTime >= 500) {
                    handleHoldInput(item);
                }
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
                handleKeyInput(item);
            });
            itemElem.addEventListener("mousedown", (e) => {
                handleDown();
            });
            itemElem.addEventListener("mouseup", (e) => {
                handleUp();
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

const renderDialog = (content, fadeIn, closable = true) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector(".dialog");
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector("#dialog");
    const clone = template.content.cloneNode(true);

    const overlayBackElem = document.querySelector(".overlay-back");

    const closeBtn = clone.querySelector("button.close");
    if (closable) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const dialog = document.querySelector(".dialog");
            dialog.remove();
            overlayBackElem.style.display = "none";
        });
    } else {
        closeBtn.style.display = "none";
    }

    const dialogContent = clone.querySelector(".dialog-content");
    dialogContent.appendChild(content);

    if (fadeIn) {
        const dialog = clone.querySelector(".dialog");
        dialog.style.opacity = 0;
        dialog.style.top = "100%";
        setTimeout(() => {
            const dialog = document.querySelector(".dialog");
            dialog.style.opacity = "";
            dialog.style.top = "";
        }, 10);
    }

    document.body.appendChild(clone);

    overlayBackElem.style.display = "block";

    if (typeof feather !== "undefined") {
        feather.replace();
    } else {
        document.querySelector(".dialog [data-feather='x']").innerText = "X";
    }
};

const renderNotification = (msg) => {
    // Close any currently existing notifications
    const notificationElem = document.querySelector(".notification");
    if (notificationElem) notificationElem.remove();
    // Clear existing notification timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    const template = document.querySelector("#notification");
    const clone = template.content.cloneNode(true);

    const message = clone.querySelector(".notification-message");
    message.innerText = msg;

    document.body.appendChild(clone);

    notificationTimeout = setTimeout(() => {
        const notification = document.querySelector(".notification");

        notification.style.opacity = 0;
        notification.style.top = "-10%";

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
