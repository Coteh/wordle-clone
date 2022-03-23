const generateShareText = (dayIndex, attempts, maxAttempts) => {
    let shareText = `Wordle Clone ${dayIndex + 1} ${attempts.length}/${maxAttempts}\n`;
    shareText += attempts
        .map((attempt) =>
            attempt
                .map((entry) => {
                    if (entry.correct) {
                        return "🟩";
                    } else if (entry.within) {
                        return "🟨";
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
