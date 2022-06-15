require("dotenv").config();

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
app.use(helmet());

// Parse request body
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static content
app.use(process.env.BASE_URL, express.static("./public"));

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

/**
 * APP ROUTES
 */

const mainRoutes = require("./routes/main.js");
const base = process.env.BASE_URL ? process.env.BASE_URL : "/";
app.use(base, mainRoutes);

/**
 *  ERROR HANDLING
 */
const { customErrorResponder, serverErrorResponder } = require("./controllers/errors.js");
app.use(customErrorResponder);
app.use(serverErrorResponder); // Serve 500 error and log uncaught problems

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
