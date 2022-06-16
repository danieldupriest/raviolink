const { log, debug } = require("./logger.js");

// Middleware to log requests
function logRequest(req, res, next) {
    const message = `Handling request to: ${req.method} ${req.url}`;
    log(message);
    debug(message);
    if (Object.keys(req.params).length > 0)
        debug("  With params: " + JSON.stringify(req.params));
    if (Object.keys(req.body).length > 0)
        debug("  With body: " + JSON.stringify(req.body));
    next();
}

// Middleware to set up template data common to many pages
function setupTemplateData(req, res, next) {
    res.locals.pageData = {
        server:
            process.env.SERVER +
            (process.env.PORT == 80 ? "" : ":" + process.env.PORT) +
            process.env.BASE_URL,
        maxUploadSize: process.env.MAX_UPLOAD_SIZE,
        previewSize: process.env.PREVIEW_SIZE || 700,
        thumbSize: process.env.THUMB_SIZE || 100,
    };
    next();
}

// Middleware to configure Content Security Policy header
function setCSPHeaders(req, res, next) {
    res.header(
        "Content-Security-Policy",
        "default-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com"
    );
    next();
}

module.exports = { logRequest, setupTemplateData, setCSPHeaders };
