class SanitizerError extends Error {
    constructor(...args) {
        super(...args);
        this.status = 400;
        Error.captureStackTrace(this, SanitizerError);
    }
}

exports.SanitizerError = SanitizerError;