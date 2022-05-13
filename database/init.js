import { config } from "dotenv";
config();
import fs from "fs";

const dbFile = process.env.DATABASE_FILE || "sqlite.db";

import db from "./database.js";

console.log("Creating database tables...");

db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, content TEXT, type TEXT);"
    );
    db.run(
        "CREATE TABLE IF NOT EXISTS timers (id INTEGER PRIMARY KEY, ip TEXT, delay_in_ms INTEGER, revert_time TEXT);"
    );
});
db.close((err) => {
    if (err) {
        console.error(err);
    }
});
console.log("Created database tables: links, timers.");
