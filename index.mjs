import config from "dotenv"
config.config()

// Create app
import express from "express"
const app = express()

// Configure mustache template engine
import mustacheExpress from "mustache-express"
app.set("views", "./views")
app.set("view engine", "mustache")
app.engine("mustache", mustacheExpress())

/**
 * RUN CORE MIDDLEWARE
 */

// Load and run helmet for web security
import helmet from "helmet"
app.use(helmet.contentSecurityPolicy())
app.use(helmet.crossOriginEmbedderPolicy())
app.use(helmet.crossOriginOpenerPolicy())
//app.use(helmet.crossOriginResourcePolicy()); This seems to hang the server on Google cloud
app.use(helmet.dnsPrefetchControl())
app.use(helmet.expectCt())
app.use(helmet.frameguard())
app.use(helmet.hidePoweredBy())
app.use(helmet.hsts())
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.originAgentCluster())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.referrerPolicy())
app.use(helmet.xssFilter())

// Parse request body
import bodyParser from "body-parser"
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

/**
 * RUN CUSTOM MIDDLEWARE
 */

import {
    logRequest,
    setupTemplateData,
    setCustomHeaders,
} from "./utils/middleware.mjs"
app.use(logRequest) // Log all requests to file and console
app.use(setupTemplateData) // Set up data for reuse in page templates
app.use(setCustomHeaders) // Set custom security headers

// Serve static content
app.use(process.env.BASE_URL, express.static("./public"))

/**
 * APP ROUTES
 */
import mainRoutes from "./routes/main.mjs"
const base = process.env.BASE_URL ? process.env.BASE_URL : "/"
app.use(base, mainRoutes)

/**
 *  ERROR HANDLING
 */

import {
    missingErrorResponder,
    customErrorResponder,
} from "./controllers/errors.mjs"
app.use(missingErrorResponder) // Serve 404 for missing pages
app.use(customErrorResponder) // Serve custom errors and log uncaught problems

/**
 * APP STARTUP
 */

import { log, debug } from "./utils/logger.mjs"
const port = process.env.PORT || 8080
app.listen(port, () => {
    const message = `Raviolink listening on port ${port}`
    log(message)
    debug(message)
})
