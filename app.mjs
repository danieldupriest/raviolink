import config from "dotenv"
config.config()
import express from "express"
import mustacheExpress from "mustache-express"
import helmet from "helmet"
import bodyParser from "body-parser"
import {
    logRequest,
    setupTemplateData,
    setCustomHeaders,
} from "./utils/middleware.mjs"
import mainRoutes from "./routes/main.mjs"
import {
    missingErrorResponder,
    customErrorResponder,
} from "./controllers/errors.mjs"

/**
 * Generates an app object ready to begin listening
 * @returns {function} A function which generates an http server
 **/
export default function createApp() {
    const app = express()
    console.log(typeof app)

    // Configure mustache template engine
    app.set("views", "./views")
    app.set("view engine", "mustache")
    app.engine("mustache", mustacheExpress())

    /**
     * RUN CORE MIDDLEWARE
     */

    // Load and run helmet for web security
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
    app.use(express.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    /**
     * RUN CUSTOM MIDDLEWARE
     */

    app.use(logRequest) // Log all requests to file and console
    app.use(setupTemplateData) // Set up data for reuse in page templates
    app.use(setCustomHeaders) // Set custom security headers

    // Serve static content
    app.use(process.env.BASE_URL, express.static("./public"))

    /**
     * APP ROUTES
     */
    const base = process.env.BASE_URL ? process.env.BASE_URL : "/"
    app.use(base, mainRoutes)

    /**
     *  ERROR HANDLING
     */

    app.use(missingErrorResponder) // Serve 404 for missing pages
    app.use(customErrorResponder) // Serve custom errors and log uncaught problems

    return app
}
