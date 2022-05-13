import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mustacheExpress from "mustache-express";
import { handleLink, frontPage, postLink } from "./controllers/links.js";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

const port = process.env.PORT || 8080;

const app = express();

const dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("views", dirname + "/views");
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/:linkCode", handleLink);
app.get("/", frontPage);
app.post("/", postLink);

app.listen(port, () => {
    console.log(`Raviolink listening on port ${port}`);
});
