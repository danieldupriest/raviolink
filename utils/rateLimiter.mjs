import dotenv from "dotenv"
dotenv.config()
import Database from "../database/Database.mjs"
import { debug } from "../utils/logger.mjs"

const WINDOW = 10 * 1000 //Access window in ms
const LIMIT = 2 //Max number of accesses to allow within window

const db = Database.instance("limiter", true) //Create in-memory database for access log

/**
 * Class for logging user accesses to restricted routes.
 */
class Access {
    constructor(ip, accessTime, id = 0) {
        this.ip = ip
        this.accessTime = accessTime
        this.id = id
    }

    /**
     * Generate accesses table in database if it doesn't exist yet
     */
    static async init() {
        db.run(
            "CREATE TABLE IF NOT EXISTS accesses (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, access_time INTEGER);"
        )
            .then((result) => {
                debug("Checked/created table accesses")
            })
            .catch((err) => {
                error(`Error creating table accesses: ${err}`)
            })
    }

    /**
     * Loads accesses from the specified IP and calculates whether the user
     * should be allowed access depending on the window and limit.
     * @param {String} ip - IP address of the user
     * @param {Number} window - Window in ms to check
     * @param {Number} limit - Number of accesses to allow in the window
     * @returns true if the user is allowed
     */
    static async allowed(ip, window, limit) {
        const now = new Date()
        const then = new Date(now.getTime() - window)
        const accesses = await this.countAccessesByIpSince(ip, then)
        return accesses + 1 <= limit
    }

    /**
     * Counts the accesses from a user since the specified time.
     * @param {String} ip - IP of the accesses to count
     * @param {Number} then - Starting date in ms since UNIX epoch
     * @returns {Number} The number of accesses since the specified time
     */
    static async countAccessesByIpSince(ip, then) {
        const thenInMs = then.getTime()
        const everything = await db.all("Select * from accesses;")
        const rows = await db.all(
            "SELECT * from accesses WHERE ip = ? AND access_time > ?;",
            [ip, thenInMs]
        )
        return rows.length
    }

    /**
     * Save a newly created Access to the database
     * @returns {Access} An Access object
     */
    async save() {
        const accessMs = this.accessTime.getTime()

        await db.run("INSERT INTO accesses (ip, access_time) VALUES (?, ?);", [
            this.ip,
            accessMs,
        ])
        const id = await db.get("SELECT last_insert_rowid();")
        let accesses = await db.run("select * from accesses;")
        this.id = id
        return this
    }
}

/**
 * Function which creates a rate-limiting middleware for use in
 * the app's pipeline. Protected routes will log each access, and
 * if the number of accesses during the specified window exceeds
 * the limit, the request will be rejected with a
 * @param {Object} options - Must contain 'window' specifying the time window
 * in ms and 'limit', specifying the maximum number of accesses allowed.
 * @returns middleware to be used with express app
 */
export default function (options = { window: WINDOW, limit: LIMIT }) {
    let window = options.window
    let limit = options.limit
    return async (req, res, next) => {
        // Get clean IP string if possible
        let ip = (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "0"
        )
            .split(":")
            .pop()

        debug("Logged access from ip: " + ip)
        const allowed = await Access.allowed(ip, window, limit)
        if (!allowed) {
            res.statusCode = 429
            return next(
                new Error(
                    "Too many requests from IP. Please wait at least 10 seconds between submissions.",
                    {
                        cause: `Too many requests from IP ${ip}`,
                    }
                )
            )
        }
        const access = new Access(ip, new Date())
        await access.save()
        next()
    }
}

Access.init()
