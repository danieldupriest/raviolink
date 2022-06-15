require("dotenv").config();
const { log, debug } = require("../utils/logger.js");

const customErrorResponder = (err, req, res, next) => {
    const { statusCode } = res;
    if (statusCode) {
        res.status(statusCode);
        return res.render("error", {
            status: statusCode,
            error: `Error: ${err}`,
            ...res.locals.pageData
        });
    } else if (!err) {
        res.status(404);
        return res.render("error", {
            status: 404,
            error: "Error: page not found",
            ...res.locals.pageData
        });
    }
    next(err);
};

const serverErrorResponder = (err, req, res, next) => {
    const message = `Server error: ${err}`;
    debug(message);
    log(message);
    res.status(500);
    return res.render("error", {
        status: 500,
        error: "A server error occurred",
        ...res.locals.pageData
    });
};

module.exports = { customErrorResponder, serverErrorResponder };