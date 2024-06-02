const generateShareText = (dayNumber, attempts, maxAttempts, options) => {
    if (!options) {
        options = {};
    }
    const wasIncomplete = attempts.length === maxAttempts && 
        attempts[maxAttempts - 1].some(entry => !entry.correct);
    let shareText = `Wordle Clone ${dayNumber} ${wasIncomplete ? "X" : attempts.length}/${maxAttempts}${
        options.hardMode ? "*" : ""
    }\n`;
    shareText += attempts
        .map((attempt) =>
            attempt
                .map((entry) => {
                    if (options.highContrastMode) {
                        if (entry.correct) {
                            return "🟧";
                        } else if (entry.within) {
                            return "🟦";
                        }
                    } else {
                        if (entry.correct) {
                            return "🟩";
                        } else if (entry.within) {
                            return "🟨";
                        }
                    }
                    return "⬛";
                })
                .join("")
        )
        .join("\n");
    return shareText;
};

if (typeof process !== "undefined") {
    module.exports = {
        generateShareText,
    };
}
