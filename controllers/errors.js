require("dotenv").config();
const { generateServerString } = require("../utils/tools.js");

const serveError = (res, code, message) => {
    res.status(code);
    return res.render("error", {
        status: code,
        error: message,
        server: generateServerString(),
    });
};

const errorResponder = (err, req, res, next) => {
    //console.error("Server error occurred. Stack trace:");
    //console.error(err.stack);
    //res.status(500).render("error", { status: 500, error: err });
    serveError(res, 500, err);
};

module.exports = { errorResponder, serveError };
