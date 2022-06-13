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
 * DEFINE MAIN APP ROUTES
 */

// Configure a rate limiter for use in certain routes
const rateLimiter = require("./utils/rateLimiter.js");
const limiter = rateLimiter({ window: 10 * 1000, limit: 5 });

// Configure upload middleware
const multer = require("multer");
const upload = multer({
    limits: { fileSize: process.env.MAX_UPLOAD_SIZE },
    dest: process.env.TEMP_FILE_PATH,
}).single("content");

// Routes
const {
    handleLink,
    frontPage,
    postLink,
    handleFile,
    linkList,
} = require("./controllers/links.js");
app.get(process.env.BASE_URL + "/links", linkList); // Shows overview list of all links
app.get(process.env.BASE_URL + "/:uid/file", handleFile); // Serves directly linked files
app.get(process.env.BASE_URL + "/:uid", [limiter, handleLink]); // Retrieves specified link
app.get(process.env.BASE_URL + "/", frontPage); // Shows default home page
app.post(process.env.BASE_URL + "/", [limiter, upload, postLink]); // Handle creation of link

/**
 *  ERROR HANDLING
 */
const { errorResponder } = require("./controllers/errors.js");
app.use(errorResponder); // Serve 500 error for uncaught problems

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
