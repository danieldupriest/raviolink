import dotenv from "dotenv"
dotenv.config()

// Generate a short unit representation for various file sizes
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

// Check if URL is valid
export function urlIsValid(input) {
    const result = input.match(validUrlRegex)
    if (result) {
        return true
    }
    return false
}
