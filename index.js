const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mustacheExpress = require("mustache-express");
const { handleLink, frontPage, postLink } = require("./controllers/links.js");
const path = require("path");
const { fileURLToPath } = require("url");
const bodyParser = require("body-parser");
const log = require("./utils/logger.js");
const errorHandler = require("./controllers/errors.js");

const port = process.env.PORT || 8080;

const app = express();

app.set("views", "./views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/:uid", log, handleLink);
app.get("/", log, frontPage);
app.post("/", log, postLink);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
