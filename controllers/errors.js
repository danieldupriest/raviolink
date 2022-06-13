require("dotenv").config();
const { log, debug } = require("../utils/logger.js");

const serveError = (res, code, message) => {
    res.status(code);
    return res.render("error", {
        status: code,
        error: message,
        ...res.locals.pageData,
    });
};

const errorResponder = (err, req, res, next) => {
    const message = `Server error: ${JSON.stringify(err)}`;
    debug(message);
    log(message);
    serveError(res, 500, "Server error");
};

module.exports = { errorResponder, serveError };
