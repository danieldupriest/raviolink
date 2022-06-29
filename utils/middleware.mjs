import { log, debug } from "./logger.mjs"

/**
 * Logging middleware which may be inserted anywhere among the app's use
 * statement pipeline, which will output debug statements during processing.
 * @param {String} text - Message to write
 * @returns
 */
export function logStep(text) {
    return (req, res, next) => {
        debug(text)
        next()
    }
}

/**
 * Middleware which will log all requests the server receives, including
 * parameter and body information if in development mode.
 */
export function logRequest(req, res, next) {
    const message = `Handling request to: ${req.method} ${req.url}`
    log(message)
    debug(message)
    if (Object.keys(req.params).length > 0)
        debug("  With params: " + JSON.stringify(req.params))
    if (Object.keys(req.body).length > 0)
        debug("  With body: " + JSON.stringify(req.body))
    next()
}

/**
 * Middleware which sets up template data common to many page templates.
 * This includes dynamic strings, such as the servername and ports. Data
 * will be available in the res.locals.pageData object.
 */
export function setupTemplateData(req, res, next) {
    let serverString
    if (process.env.NODE_ENV == "development" || process.env.NODE_ENV == "test")
        serverString = `http://localhost:${process.env.PORT}${process.env.BASE_URL}`
    else serverString = `https://${process.env.SERVER}${process.env.BASE_URL}`
    res.locals.pageData = {
        maxUploadSize: process.env.MAX_UPLOAD_SIZE,
        previewSize: process.env.PREVIEW_SIZE || 700,
        server: serverString,
        thumbSize: process.env.THUMB_SIZE || 100,
    }
    next()
}

/**
 * Middleware to configure custom security headers
 */
export function setCustomHeaders(req, res, next) {
    res.header("Permissions-Policy", "camera=(), microphone=()")
    res.header(
        "Content-Security-Policy",
        "default-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com"
    )
    next()
}