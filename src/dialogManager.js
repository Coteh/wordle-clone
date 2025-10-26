(function () {
    // Simple dialog manager with LIFO stack
    const stack = [];
    let current = null;

    const cloneContent = (content) => {
        // content may be a DocumentFragment or Element; clone deeply
        return content.cloneNode(true);
    };

    const renderItemNow = (item) => {
        // For prompts we need to inject wrapped callbacks so manager controls closing and popping
        if (item.type === "prompt") {
            const wrappedOptions = Object.assign({}, item.options || {});
            // Wrap onConfirm/onCancel so that manager can close/pop before callback
            const origConfirm = item.callbacks && item.callbacks.onConfirm;
            const origCancel = item.callbacks && item.callbacks.onCancel;
            wrappedOptions.onConfirm = async () => {
                // First close the current prompt so manager state and DOM are consistent
                window.DialogManager.closeCurrent();
                try {
                    if (typeof origConfirm === "function") await origConfirm();
                } catch (err) {
                    // swallow to avoid breaking manager flow
                    console.error(err);
                }
            };
            wrappedOptions.onCancel = async () => {
                window.DialogManager.closeCurrent();
                try {
                    if (typeof origCancel === "function") await origCancel();
                } catch (err) {
                    console.error(err);
                }
            };
            // renderPromptDialog expects content and options (it will call the onConfirm/onCancel when buttons pressed)
            renderPromptDialog(cloneContent(item.content), wrappedOptions);
        } else {
            // regular dialog; options.closable will be honored by renderDialog; close button will call DialogManager.closeCurrent()
            renderDialog(cloneContent(item.content), item.options || {});
        }

        // After the dialog is rendered into the DOM, if there is a rehydrate callback stored on the item,
        // invoke it so callers can attach event listeners to the actual DOM nodes.
        // (The rehydrate callback receives the rendered dialog element.)
        try {
            const renderedDialog = document.querySelector(".dialog");
            if (renderedDialog && item && item.rehydrate && typeof item.rehydrate === "function") {
                try {
                    item.rehydrate(renderedDialog);
                } catch (err) {
                    console.error("Error running rehydrate callback:", err);
                }
            }
        } catch (e) {
            // no-op
        }
    };

    window.DialogManager = {
        // content: DocumentFragment or Element; type: "regular" | "prompt"
        show(content, options = {}, type = "regular", callbacks = {}, processImmediate = false) {
            const item = {
                content: cloneContent(content),
                options: options || {},
                callbacks: callbacks || {},
                type: type === "prompt" ? "prompt" : "regular",
                // store rehydrate function (optional) so manager can call it when this dialog is rendered again
                rehydrate: callbacks && typeof callbacks.rehydrate === "function" ? callbacks.rehydrate : null,
            };

            // If no current dialog, show immediately
            if (!current && !document.querySelector(".dialog")) {
                current = item;
                renderItemNow(item);
                return;
            }

            // If there's a current dialog
            if (processImmediate) {
                // push current to stack and immediately render new one
                if (current) {
                    stack.push(current);
                }
                current = item;
                // Close existing DOM dialog (if any) before rendering new one - keep overlay behavior consistent
                const existing = document.querySelector(".dialog");
                if (existing) {
                    try {
                        existing.close && existing.close();
                    } catch (e) {}
                    existing.remove();
                }
                renderItemNow(item);
            } else {
                // simply push the new one to stack
                stack.push(item);
            }
        },

        closeCurrent() {
            // Remove current dialog element from DOM (if present)
            const dialog = document.querySelector(".dialog");
            if (dialog) {
                try {
                    dialog.close && dialog.close();
                } catch (e) {}
                dialog.remove();
            }
            // Hide overlay
            const overlayBackElem = document.querySelector(".overlay-back");
            if (overlayBackElem) overlayBackElem.style.display = "none";

            // Pop next from stack (LIFO)
            if (stack.length > 0) {
                const next = stack.pop();
                current = next;
                // renderItemNow will invoke the stored rehydrate callback (if any) after appending DOM
                renderItemNow(next);
            } else {
                current = null;
            }
        },

        // Handles overlay click: closes only if current dialog is closable
        overlayClickHandler() {
            // Find the current dialog (top of stack or current)
            let closable = true;
            let dialogItem = null;
            if (current) {
                dialogItem = current;
            } else if (stack.length > 0) {
                dialogItem = stack[stack.length - 1];
            }
            if (dialogItem && typeof dialogItem.options === "object" && "closable" in dialogItem.options) {
                closable = dialogItem.options.closable;
            }
            if (closable) {
                window.DialogManager.closeCurrent();
            }
        },
    };
})();
