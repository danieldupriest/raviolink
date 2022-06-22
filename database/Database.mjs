import config from "dotenv"
config.config()
import { log, debug, error } from "../utils/logger"
import sqlite3 from "sqlite3"
import fs from "fs"
sqlite3.verbose()

/**
 * Allows multiple shared connections to a sqlite database either on disk or in memory.
 * @returns {Object} A container for the instance() function
 */
function Database() {
    var instances = {} // Store database references and configuration

    /**
     * This looks for a connected database of the supplied name, and if it doesn't
     * exist, it creates it and returns an object with db functions.
     * @param {String} name - This is the name of the database to connect to, such as 'testing'
     * @param {Boolean} memory - This creates a database in-memory
     * @returns {Object} An object containing all the db run, get, and all functions.
     */
    function instance(name = "default", memory = false) {
        if (!instances[name]) {
            let dbFile
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
            }
        }
        debug(`Getting db instance: ${name}`)
        const db = instances[name].db
        return {
            /**
             * Runs the provided SQL code without returning anything
             * @param {String} sql - The SQL query to run
             * @param {Array} params - An array of variables to populate the query
             */
            run: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.run(sql, params, (err) => {
                        if (err) reject(err)
                        resolve(true)
                    })
                })
            },
            /**
             * Runs the provided SQL code returning one result
             * @param {String} sql - The SQL query to run
             * @param {Array} params - An array of variables to populate the query
             * @returns {Object} - A dictionary of the selected fields
             */
            get: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.get(sql, params, (err, result) => {
                        if (err) reject(err)
                        resolve(result)
                    })
                })
            },
            /**
             * Runs the provided SQL code returning an array of results
             * @param {String} sql - The SQL query to run
             * @param {Array} params - An array of variables to populate the query
             * @returns {[Object]} - An array of dictionaries containing the selected fields
             */
            all: (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.all(sql, params, (err, rows) => {
                        if (err) reject(err)
                        resolve(rows)
                    })
                })
            },
            /**
             * Closes all connections to the database and deletes it from disk if temporary
             */
            close: () => {
                debug(`Closing database: ${name}`)
                return new Promise((resolve, reject) => {
                    db.close((err) => {
                        if (err) reject(err)
                        if (
                            process.env.NODE_ENV == "test" &&
                            !instances[name].memory
                        ) {
                            const file = instances[name].file
                            debug(`Trying to unlink file: ${file}`)
                            fs.unlinkSync(file)
                        }
                        delete instances[name]
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
