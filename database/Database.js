const { config } = require("dotenv");
const { get } = require("express/lib/response");
config();
const sqlite3 = require("sqlite3");
sqlite3.verbose();

const dbFile = process.env.DATABASE_FILE || "./database/sqlite.db";

class Database {
    constructor(memory = false) {
        this.db = new sqlite3.Database(memory ? ":memory:" : dbFile, (err) => {
            if (err) throw err;
            console.log(
                "Opened database " + (memory ? "in memory" : `file ${dbFile}`)
            );
        });
    }

    run(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    get(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    all(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = Database;
