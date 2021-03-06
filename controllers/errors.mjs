import config from "dotenv"
import multer from "multer"
config.config()
import { log, debug, error } from "../utils/logger.mjs"

/**
 * Sets up a 404 error for any unhandled requests that is passed to
 * the customErrorResponder
 */
export const missingErrorResponder = (req, res, next) => {
    const error = new Error("Resource not found")
    res.status(404)
    next(error)
}

/**
 * Logs and renders any errors passed on from previous middleware/routes.
 * Unspecified errors show as a 500 server error.
 */
export const customErrorResponder = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.statusCode = 413
    }
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    res.status(statusCode)
    if ([400, 404, 429, 413].includes(statusCode)) {
        debug(err.message)
        if (err.cause) debug(" " + err.cause)
        log(err.message)
        if (err.cause) log(" " + err.cause)
    } else {
        if (process.env.NODE_ENV != "test") error(err)
        log(err.message)
    }
    return res.render("error", {
        status: statusCode,
        error:
            statusCode == 500
                ? `A server error occurred while processing this request`
                : err.message,
        ...res.locals.pageData,
    })
}
