require("dotenv").config();
const express = require("express");
const mustacheExpress = require("mustache-express");
const {
    handleLink,
    frontPage,
    postLink,
    handleFile,
    linkList,
} = require("./controllers/links.js");
const path = require("path");
const { fileURLToPath } = require("url");
const bodyParser = require("body-parser");
const log = require("./utils/logger.js");
const { errorResponder, serveError } = require("./controllers/errors.js");
const rateLimiter = require("./utils/rateLimiter.js");
const multer = require("multer");

const port = process.env.PORT || 8080;

const app = express();

app.set("views", "./views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.disable("x-powered-by");
app.use(express.static("./public"));
app.use(process.env.BASE_URL, express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(log);
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
        "Content-Security-Policy",
        `default-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com`
    );
    next();
});

const limiter = rateLimiter({ window: 10 * 1000, limit: 5 });
app.get(process.env.BASE_URL + "/links", [limiter, linkList]);
app.get(process.env.BASE_URL + "/:uid/file", [limiter, handleFile]);
app.get(process.env.BASE_URL + "/:uid", [limiter, handleLink]);
app.get(process.env.BASE_URL + "/", frontPage);
const upload = multer({
    limits: { fileSize: 10000000 },
    dest: process.env.TEMP_FILE_PATH,
});
app.post(
    process.env.BASE_URL + "/",
    limiter,
    upload.single("content"),
    postLink
);
app.use(errorResponder);

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
