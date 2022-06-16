require("dotenv").config();
const { logStep } = require("./utils/middleware.js");

// Create app
const express = require("express");
const app = express();

// Configure mustache template engine
const mustacheExpress = require("mustache-express");
app.set("views", "./views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

app.use(logStep("Before helmet"));

/**
 * RUN CORE MIDDLEWARE
 */

// Load and run helmet for web security
const helmet = require("helmet");
app.use(helmet());

app.use(logStep("Before json"));

// Parse request body
const bodyParser = require("body-parser");
app.use(express.json());
app.use(logStep("Before bodyparser"));
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * RUN CUSTOM MIDDLEWARE
 */

const {
    logRequest,
    setupTemplateData,
    setCSPHeaders,
} = require("./utils/middleware.js");
app.use(logStep("Before logRequest"));
app.use(logRequest); // Log all requests to file and console
app.use(logStep("Before TemplateData"));
app.use(setupTemplateData); // Set up data for reuse in page templates
app.use(logStep("Before CSPHeaders"));
app.use(setCSPHeaders); // Set custom Content Security Policy header

/**
 * APP ROUTES
 */
app.use(logStep("Before routes"));
const mainRoutes = require("./routes/main.js");
const base = process.env.BASE_URL ? process.env.BASE_URL : "/";
app.use(base, mainRoutes);

app.use(logStep("Before static"));
// Serve static content
app.use(process.env.BASE_URL, express.static("./public"));

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
