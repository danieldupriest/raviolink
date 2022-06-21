import dotenv from "dotenv"
dotenv.config()
import Database from "../database/Database.mjs"
import { debug } from "../utils/logger.mjs"

const WINDOW = 10 * 1000 //Access window in ms
const LIMIT = 2 //Max number of accesses to allow within window

const db = Database.instance("limiter", { temporary: true, memory: true }) //Create in-memory database for access log

class Access {
    constructor(ip, accessTime, id = 0) {
        this.ip = ip
        this.accessTime = accessTime
        this.id = id
    }

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

    static async allowed(ip, window, limit) {
        const now = new Date()
        const then = new Date(now.getTime() - window)
        const accesses = await this.countAccessesByIpSince(ip, then)
        return accesses + 1 <= limit
    }

    static async countAccessesByIpSince(ip, then) {
        const thenInMs = then.getTime()
        const everything = await db.all("Select * from accesses;")
        const rows = await db.all(
            "SELECT * from accesses WHERE ip = ? AND access_time > ?;",
            [ip, thenInMs]
        )
        return rows.length
    }

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

export default (options = { window: WINDOW, limit: LIMIT }) => {
    let window = options.window
    let limit = options.limit
    return async (req, res, next) => {
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
