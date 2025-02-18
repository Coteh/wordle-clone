const isiOS = () => {
    return navigator.userAgent.match(/ipad|iphone/i);
};

// Use legacy document.execCommand API for older browsers that do not have navigator.clipboard
// https://stackoverflow.com/a/30810322
const fallbackCopyShareText = (shareText) => {
    const textArea = document.createElement("textarea");
    textArea.value = shareText;

    // Prevent this element from appearing in the accessibility tree
    textArea.ariaHidden = "true";
    textArea.tabIndex = -1;

    // Prevent browser from scrolling to the bottom of page and focusing on the element
    textArea.style.top = "-100px";
    textArea.style.left = "-100px";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    if (isiOS()) {
        // iOS-specific solution adapted from https://stackoverflow.com/a/46858939
        range = document.createRange();
        range.selectNodeContents(textArea);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 9999999);
    } else {
        textArea.select();
    }

    let successful = false;
    try {
        successful = document.execCommand("copy");
        if (successful) {
            const message = document.createElement("span");
            message.innerText = "Copied to clipboard!";
            renderDialog(message, { closable: true });
        } else {
            const message = document.createElement("span");
            message.innerText = "Could not copy to clipboard";
            renderDialog(message, { closable: true });
        }
    } catch (e) {
        console.error(e);
        const message = document.createElement("span");
        message.innerText = "Could not copy to clipboard due to error";
        renderDialog(message, { closable: true });
    } finally {
        textArea.remove();
    }
    return successful;
};

const copyShareText = async (shareText) => {
    if (!navigator.clipboard) {
        return fallbackCopyShareText(shareText);
    }
    try {
        await navigator.clipboard.writeText(shareText);
    } catch (e) {
        console.error(e);
        renderNotification("Could not copy to clipboard due to error");
        return false;
    }
    renderNotification("Copied to clipboard!");
    return true;
};

const triggerShare = async (shareText) => {
    const data = {
        text: shareText,
    };
    if (navigator.canShare && !navigator.canShare(data)) {
        console.log('Share data cannot be validated for share sheet, falling back to clipboard for share...');
        // Fallback to copy to clipboard
        return copyShareText(shareText);
    }
    if (!navigator.share) {
        console.log('Share sheet not available for this browser, falling back to clipboard for share...');
        // Fallback to copy to clipboard
        return copyShareText(shareText);
    }
    try {
        await navigator.share(data);
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            console.log('Sharing was not allowed by the user or platform');
            // Fallback to copy to clipboard
            return copyShareText(shareText);
        } else if (err.name === 'AbortError') {
            console.log('User aborted share operation');
        } else if (err.name === 'NotSupportedError') {
            console.error('Share sheet operation not supported');
            // Fallback to copy to clipboard
            return copyShareText(shareText);
        } else {
            console.error('Error sharing content:', err);
            renderNotification("Could not share due to error");
            return false;
        }
    }
    return true;
}
