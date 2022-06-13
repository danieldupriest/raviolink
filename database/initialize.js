const Database = require("./Database.js");
const { debug, error } = require("../utils/logger.js");

const db = new Database();

async function init() {
    await db
        .run(
            "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, content TEXT, type TEXT, created_on INTEGER, expires_on INTEGER, delete_on_view INTEGER, raw INTEGER, mime_type TEXT, deleted INTEGER, views_left INTEGER, text_type TEXT);"
        )
        .then((result) => {
            debug("Checked/created table links");
        })
        .catch((err) => {
            error(`Error creating table links: ${JSON.stringify(err)}`);
        });
    await db
        .run(
            "CREATE TABLE IF NOT EXISTS timers (id INTEGER PRIMARY KEY, ip TEXT, delay_in_ms INTEGER, revert_time INTEGER, created_on INTEGER);"
        )
        .then((result) => {
            debug("Checked/created table timers");
        })
        .catch((err) => {
            error(`Error creating table timers: ${JSON.stringify(err)}`);
        });
}

init();
