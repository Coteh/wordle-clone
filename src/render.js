const CORRECT_COLOR = "green";
const WITHIN_COLOR = "#eec039";
const INCORRECT_COLOR = "#333";
const STANDARD_COLOR = "#aaa";

let notificationTimeout;

const renderInputRow = (parentElem, numberOfLetters) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.className = "input-row";

    for (let i = 0; i < numberOfLetters; i++) {
        const box = document.createElement("div");
        box.style.padding = "1em";
        box.style.border = "1px solid black";
        box.style.width = "3.8em";
        box.style.height = "3.8em";
        box.style.lineHeight = "1.9em";
        box.style.backgroundColor = STANDARD_COLOR;
        box.style.textAlign = "center";
        box.style.position = "relative";
        box.style.boxSizing = "border-box";
        box.style.display = "flex";
        box.style.justifyContent = "center";
        box.style.alignItems = "center";
        const letterElem = document.createElement("span");
        letterElem.style.display = "inline-block";
        letterElem.style.verticalAlign = "middle";
        letterElem.style.marginTop = "0.5rem";
        letterElem.style.fontSize = "3rem";
        letterElem.style.fontWeight = "bold";
        letterElem.style.fontFamily = "sans-serif";
        letterElem.style.textTransform = "uppercase";
        letterElem.style.color = "white";
        box.appendChild(letterElem);
        container.appendChild(box);
    }

    parentElem.appendChild(container);

    return container;
};

const renderKeyboard = (parentElem, letterMap, handleKeyInput) => {
    const rows = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
    ];
    const bigKeys = ["enter", "backspace"];
    const container = document.createElement("div");
    container.id = "keyboard";
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.width = "500px";
    container.style.justifyContent = "center";

    rows.forEach((row) => {
        const rowElem = document.createElement("div");
        rowElem.style.display = "flex";
        row.forEach((item) => {
            const letterStatus = letterMap.get(item);
            const itemElem = document.createElement("div");
            itemElem.style.padding = "1em 0.5em";
            itemElem.style.border = "1px solid black";
            itemElem.style.width = bigKeys.includes(item) ? "2.3em" : "0.8em";
            itemElem.style.height = "1.5em";
            itemElem.style.lineHeight = "1.5em";
            itemElem.style.backgroundColor =
                letterStatus === "correct"
                    ? CORRECT_COLOR
                    : letterStatus === "within"
                    ? WITHIN_COLOR
                    : letterStatus === "incorrect"
                    ? INCORRECT_COLOR
                    : STANDARD_COLOR;
            itemElem.style.color = "white";
            itemElem.style.textAlign = "center";
            itemElem.addEventListener("click", (e) => {
                e.preventDefault();
                console.log(item);
                handleKeyInput(item);
            });
            const letterElem = document.createElement("span");
            letterElem.innerText = item === "backspace" ? "←" : item;
            letterElem.style.display = "inline-block";
            letterElem.style.verticalAlign = "middle";
            letterElem.style.fontSize = bigKeys.includes(item) ? "1em" : "1.5em";
            letterElem.style.fontWeight = "bold";
            letterElem.style.fontFamily = "sans-serif";
            letterElem.style.pointerEvents = "none";
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

    return container;
};

const renderDialog = (content, fadeIn) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector(".dialog");
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector("#dialog");
    const clone = template.content.cloneNode(true);

    const closeBtn = clone.querySelector("button.close");
    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const dialog = document.querySelector(".dialog");
        dialog.remove();
    });

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

    feather.replace();
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
