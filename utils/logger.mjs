import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import RavioliDate from "./dates.mjs"

const environment = process.env.NODE_ENV || "development"
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const fullPath = path.resolve(dirname, "..")
const logFile = fs.createWriteStream(fullPath + "/debug.log")

const log = (input) => {
    const d = new RavioliDate()
    logFile.write(d.toISODate() + ": " + input + "\n")
}

const debug = (input) => {
    if (environment == "development") console.debug(input)
}

const error = (input) => {
    console.error(input)
}

export { log, debug, error }
