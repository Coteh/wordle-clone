class LocalStorageNotAvailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "LocalStorageNotAvailableError";
    }
}

if (typeof process !== "undefined") {
    module.exports.LocalStorageNotAvailableError = LocalStorageNotAvailableError;
}
