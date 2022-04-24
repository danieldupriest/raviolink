require("dotenv").config();
const express = require("express");
const mustacheExpress = require("mustache-express");

const port = 8080;

const app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.use(express.static("public"));

app.get("/:linkCode", (req, res) => {
    const data = {
        content: req.params.linkCode,
    };
    res.render("viewLink", data);
});

app.get("/", (req, res) => {
    res.render("createLink");
});

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
