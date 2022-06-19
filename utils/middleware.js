const { log, debug } = require("./logger.js");

// Middleware to troubleshoot bugs
function logStep(text) {
    return (req, res, next) => {
        debug(text);
        next();
    };
}

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
        maxUploadSize: process.env.MAX_UPLOAD_SIZE,
        previewSize: process.env.PREVIEW_SIZE || 700,
        thumbSize: process.env.THUMB_SIZE || 100,
    };
    if (process.env.NODE_ENV == "development") {
        res.locals.pageData.server = `http://localhost:${process.env.PORT}${process.env.BASE_URL}`;
    } else {
        res.locals.pageData.server = `https://${process.env.SERVER}${process.env.BASE_URL}`;
    }
    next();
}

// Middleware to configure custom security headers
function setCustomHeaders(req, res, next) {
    // Set Feature Policy header
    res.header("Feature-Policy", "camera 'none'; microphone 'none';");

    // Set Content Security Policy header
    res.header(
        "Content-Security-Policy",
        "default-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com"
    );
    next();
}

module.exports = { logRequest, setupTemplateData, setCustomHeaders, logStep };
