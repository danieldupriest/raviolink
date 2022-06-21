import fs from "fs"
import Date from "./date.mjs"

const logFile = fs.createWriteStream("./debug.log")

/**
 * Writes a message out to the debug.log file
 * @param {String} input - Message to log
 */
export const log = (input) => {
    const d = new Date()
    logFile.write(d.toISODate() + ": " + input + "\n")
}

/**
 * Writes a message to the console if in development mode
 * @param {String} input - Message to write
 */
export const debug = (input) => {
    if (process.env.NODE_ENV == "development") console.debug(input)
}

/**
 * Writes an error message to the console
 * @param {String}} input - Message to write
 */
export const error = (input) => {
    console.error(input)
}
