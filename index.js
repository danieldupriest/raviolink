require("dotenv").config();
const express = require("express");
const mustacheExpress = require("mustache-express");

const port = process.env.PORT || 8080;

const app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.use(express.static("public"));

app.get("/:linkCode", (req, res) => {
    let linkContent = `Lorem Ipsum is simply dummy text\nof the printing and typesetting industry.\nLorem Ipsum has been the industry's\nstandard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`;
    let split = linkContent.split("\n");
    let output = "";
    split.forEach((row) => {
        output += `<span>${row}</span>`;
    });
    const data = {
        raw: linkContent,
        content: output,
        createdOn: "April 24, 2022",
        link: true,
        linkCode: req.params.linkCode,
    };
    res.render("index", data);
});

app.get("/", (req, res) => {
    const data = {
        link: false,
    };
    res.render("index", data);
});

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
