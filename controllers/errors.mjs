import config from "dotenv"
config.config()
import { log, debug, error } from "../utils/logger.mjs"

const missingErrorResponder = (req, res, next) => {
    const error = new Error("Resource not found")
    res.status(404)
    next(error)
}

const customErrorResponder = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    res.status(statusCode)
    if ([400, 404, 429].includes(statusCode)) {
        debug(err.message)
        if (err.cause) debug(" " + err.cause)
        log(err.message)
        if (err.cause) log(" " + err.cause)
    } else {
        error({ err })
        log({ err })
    }
    return res.render("error", {
        status: statusCode,
        error: err.message,
        ...res.locals.pageData,
    })
}

export { missingErrorResponder, customErrorResponder }
