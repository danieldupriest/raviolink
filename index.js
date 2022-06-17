require("dotenv").config();

// Create app
const express = require("express");
const app = express();

// Configure mustache template engine
const mustacheExpress = require("mustache-express");
app.set("views", "./views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

/**
 * RUN CORE MIDDLEWARE
 */

// Load and run helmet for web security
const helmet = require("helmet");
app.use(helmet.contentSecurityPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
//app.use(helmet.crossOriginResourcePolicy()); This seems to hang the server on Google cloud
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

// Parse request body
const bodyParser = require("body-parser");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * RUN CUSTOM MIDDLEWARE
 */

const {
    logRequest,
    setupTemplateData,
    setCSPHeaders,
} = require("./utils/middleware.js");
app.use(logRequest); // Log all requests to file and console
app.use(setupTemplateData); // Set up data for reuse in page templates
app.use(setCSPHeaders); // Set custom Content Security Policy header

// Serve static content
app.use(process.env.BASE_URL, express.static("./public"));

/**
 * APP ROUTES
 */
const mainRoutes = require("./routes/main.js");
const base = process.env.BASE_URL ? process.env.BASE_URL : "/";
app.use(base, mainRoutes);

/**
 *  ERROR HANDLING
 */

const {
    missingErrorResponder,
    customErrorResponder,
} = require("./controllers/errors.js");
app.use(missingErrorResponder); // Serve 404 for missing pages
app.use(customErrorResponder); // Serve custom errors and log uncaught problems

/**
 * APP STARTUP
 */

const { log, debug } = require("./utils/logger.js");
const port = process.env.PORT || 8080;
app.listen(port, () => {
    const message = `Raviolink listening on port ${port}`;
    log(message);
    debug(message);
});
