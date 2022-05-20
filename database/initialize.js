const { genDb } = require("./database.js");

const db = genDb();

console.log("Connected to SQlite database");
await db
    .run(
        "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, content TEXT, type TEXT, created_on INTEGER, expires_on INTEGER, delete_on_view INTEGER, raw INTEGER);"
    )
    .then((result) => {
        console.log("Checked/created table: links");
    })
    .catch((err) => {
        console.error(err);
    });
await db
    .run(
        "CREATE TABLE IF NOT EXISTS timers (id INTEGER PRIMARY KEY, ip TEXT, delay_in_ms INTEGER, revert_time INTEGER, created_on INTEGER);"
    )
    .then((result) => {
        console.log("Checked/created table: timers");
    })
    .catch((err) => {
        console.error(err);
    });
