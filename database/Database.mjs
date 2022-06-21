import config from "dotenv"
config.config()
import { log, debug, error } from "../utils/logger.mjs"
import sqlite3 from "sqlite3"
import fs from "fs"
sqlite3.verbose()

function Database() {
    var instances = {}

    function instance(name, options = {}) {
        const { temporary, memory } = options
        let dbFile
        if (!instances[name]) {
            if (memory) {
                dbFile = ":memory:"
            } else {
                dbFile = `./database/${name}${
                    process.env.NODE_ENV == "test" ? ".test" : ""
                }.db`
            }
            instances[name] = {
                db: new sqlite3.Database(dbFile, (err) => {
                    if (err) error(err)
                    else debug(`Connected to db: ${name}`)
                }),
                file: dbFile,
                memory: memory,
                temporary: true,
            }
        }
        let db = instances[name].db
        debug(`Getting db instance: ${name}`)
        return {
            run: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.run(sql, params, (err) => {
                        if (err) reject(err)
                        resolve(true)
                    })
                })
            },
            get: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.get(sql, params, (err, result) => {
                        if (err) reject(err)
                        resolve(result)
                    })
                })
            },
            all: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.all(sql, params, (err, rows) => {
                        if (err) reject(err)
                        resolve(rows)
                    })
                })
            },
            close: () => {
                debug(`Closing database: ${name}`)
                const { file, db, temporary, memory } = instances[name]
                return new Promise((resolve, reject) => {
                    db.close((err) => {
                        if (err) reject(err)
                        delete instances[name]
                        if (temporary && !memory) {
                            debug(`Trying to unlink file: ${file}`)
                            fs.unlinkSync(file)
                        }
                        resolve()
                    })
                })
            },
        }
    }

    return {
        instance: instance,
    }
}

export default Database()
