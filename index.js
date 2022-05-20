const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mustacheExpress = require("mustache-express");
const { handleLink, frontPage, postLink } = require("./controllers/links.js");
const path = require("path");
const { fileURLToPath } = require("url");
const bodyParser = require("body-parser");
const log = require("./utils/logger.js");
const { errorResponder } = require("./controllers/errors.js");
const rateLimiter = require("./utils/rateLimiter.js");

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
    next();
});
const limiter = rateLimiter({ window: 10 * 1000, limit: 5 });
app.get(process.env.BASE_URL + "/:uid", limiter, handleLink);
app.get(process.env.BASE_URL + "/", frontPage);
app.post(process.env.BASE_URL + "/", limiter, postLink);
app.use(errorResponder);

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
