import { createTables } from "./database.js";
import fs from "fs";

const dbFile = process.env.DATABASE_FILE || "sqlite.db";

console.log("Deleting database if exists.");
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

createTables()
    .then()
    .catch((err) => console.log(error));
