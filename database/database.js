const { config } = require("dotenv");
config();
const sqlite3 = require("sqlite3");
sqlite3.verbose();

const dbFile = process.env.DATABASE_FILE || "./database/sqlite.db";

console.log("Opening database file: " + dbFile);
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to SQlite database");
        db.run(
            "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, content TEXT, type TEXT, created_on INTEGER, expires_on INTEGER, delete_on_view INTEGER);",
            (err) => {
                if (err) console.log(err);
                console.log("Checked/created table: links");
            }
        );
        db.run(
            "CREATE TABLE IF NOT EXISTS timers (id INTEGER PRIMARY KEY, ip TEXT, delay_in_ms INTEGER, revert_time INTEGER, created_on INTEGER);",
            (err) => {
                if (err) console.log(err);
                console.log("Checked/created table: timers");
            }
        );
    }
});

const run = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            resolve(true);
        });
    });
};

const get = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

const all = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
};

module.exports = { db, run, get, all };
