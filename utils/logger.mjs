import fs from "fs"
import RavioliDate from "./dates.mjs"

const logFile = fs.createWriteStream("./debug.log")

const log = (input) => {
    const d = new RavioliDate()
    logFile.write(d.toISODate() + ": " + input + "\n")
}

const debug = (input) => {
    if (process.env.NODE_ENV == "development") console.debug(input)
}

const error = (input) => {
    console.error(input)
}

export { log, debug, error }
