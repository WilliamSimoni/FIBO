const { SanitizerError } = require(`../Error_Class/SanitizerError`);

function errorJSONParser(err, request, response, next) {
    if (err instanceof SyntaxError && err.status === 400) {
        response.status(400).json({ status: 400, errors: ['body must be in json'] });
        return;
    }
    next(err);
}

function sanitizerErr(err, request, response, next) {
    if (err instanceof SanitizerError && err.status === 400) {
        response.status(400).json({ status: 400, errors: [err.message] });
        return;
    }
    next(err);
}

function genericError(err, request, response, next) {
    console.error(err.stack);
    response.status(400).json({ status: 400, errors: ['Something went wrong'] });
    return;
}

module.exports = {
    errorJSONParser: errorJSONParser,
    sanitizerErr: sanitizerErr,
    genericError: genericError
}