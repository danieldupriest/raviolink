import config from "dotenv"
config.config()
import { log, debug } from "../utils/logger.mjs"
import sqlite3 from "sqlite3"
import fs from "fs"
sqlite3.verbose()

export default class Database {
    constructor(memory = false) {
        const dbFile = process.env.TESTING
            ? "./database/testing.db"
            : process.env.DATABASE_FILE || "./database/sqlite.db"
        this.db = new sqlite3.Database(memory ? ":memory:" : dbFile, (err) => {
            if (err) throw err
            debug(
                "Opened database " + (memory ? "in memory" : `file ${dbFile}`)
            )
        })
    }

    run(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err)
                resolve(true)
            })
        })
    }

    get(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) reject(err)
                resolve(result)
            })
        })
    }

    all(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err)
                resolve(rows)
            })
        })
    }

    close() {
        this.db.close()
        if (process.env.TESTING) {
            try {
                if (fs.existsSync("./testing.db")) fs.unlinkSync("./testing.db")
            } catch (err) {
                console.error(err)
            }
        }
    }
}
