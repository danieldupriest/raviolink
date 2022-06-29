import dotenv from "dotenv"
dotenv.config()
import { log } from "./logger.mjs"
import fs from "fs"

/**
 * Generate a shortened representation of a file size
 * @param {Number} bytes - The size in bytes
 * @param {Number} decimals - The number of decimals to include
 * @returns {String} A shortened string representation of the size
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

const validUrlRegex = new RegExp(
    `^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\/\\\+&amp;%\$#_~:=]*)?$`
)

/**
 * Check if URL is valid and supported by the app
 * @param {String} input - URL to check
 * @returns true if the URL is valid and supported
 */
export function urlIsValid(input) {
    const result = input.match(validUrlRegex)
    if (result) {
        return true
    }
    return false
}

/**
 * Check if a UID is valid, composed of 7 alphanumeric characters
 * @param {String} uid - UID to check
 * @returns true if the UID is valid
 */
export function uidIsValid(uid) {
    const match = uid.match(/[A-Za-z0-9]{7}/)
    if (!match) return false
    return true
}

/**
 * Generates a random UID of the specified length. Uppercase and lowercase
 * letters, as well as digits 0-9 are used.
 * @param {Number} length - Length of the UID to generate
 * @returns A random UID of the specified length
 */
export function genUid(length) {
    const alphabet =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let output = ""
    for (let i = 0; i < length; i++) {
        const randomInt = Math.floor(Math.random() * alphabet.length)
        const randomChar = alphabet.charAt(randomInt)
        output += randomChar
    }
    return output
}

/**
 * Recursively check subdirectories under the provided root directory to see if
 * a file exists.
 * @param {String} filePath - Filename to search for. Preceding path is dropped.
 * @param {} rootPath - Starting directory to search from. e.g. './files/'
 * @returns true if the file is found anywhere within the root path.
 */
export function fileExistsRecursive(filePath, rootPath) {
    if (!fs.existsSync(rootPath))
        throw new Error(`Specified root path does not exist`)
    const filename = filePath.split("/").pop()
    const dirs = [rootPath]
    while (dirs.length > 0) {
        const currentDir = dirs.pop()
        const files = fs.readdirSync(currentDir)
        for (const file of files) {
            const absolute = currentDir + "/" + file
            if (fs.statSync(absolute).isDirectory()) {
                dirs.push(absolute)
            } else if (absolute.includes(filename)) {
                return true
            }
        }
    }
    return false
}
