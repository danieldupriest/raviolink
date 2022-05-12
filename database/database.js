import { config } from "dotenv";
config();
import sqlite3 from "sqlite3";
sqlite3.verbose();

const dbFile = process.env.DATABASE_FILE || "sqlite.db";

console.log("Opening database file: " + dbFile);
let db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        throw new Error(err);
    }
    console.log("Connected to SQlite database");
});
export default db;
