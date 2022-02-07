class ProjectNotExistError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, ProjectNotExistError);
    }
}

class FleetNotExistError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, FleetNotExistError);
    }
}

class zdmGenericError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, zdmGenericError);
    }
}


class ParametersError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, ParametersError);
    }
}

class TooMuchRetriesError extends Error{
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, TooMuchRetriesError);
    }
}

class NothingFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

exports.ProjectNotExistError = ProjectNotExistError;
exports.ParametersError = ParametersError;
exports.TooMuchRetriesError = TooMuchRetriesError;
exports.NothingFoundError = NothingFoundError;
exports.FleetNotExistError = FleetNotExistError;
exports.zdmGenericError = zdmGenericError;