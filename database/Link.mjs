import dotenv from "dotenv"
dotenv.config()
import Database from "./Database.mjs"
import { genUid } from "../utils/tools.mjs"
import Date from "../utils/date.mjs"
import fs from "fs"
import { debug, error } from "../utils/logger.mjs"

const URL_LENGTH = 7
const MAX_GEN_TRIES = 10

const db = Database.instance("default")

/**
 * Data class to store user-submitted links
 */
export default class Link {
    constructor(
        content,
        type,
        expiresOn,
        deleteOnView,
        raw,
        textType,
        ip,
        tempFilename = "",
        mimeType = "",
        id = 0,
        createdOn = null,
        uid = "",
        deleted = false,
        viewsLeft = null,
        views = 0
    ) {
        this.content = content
        this.type = type
        this.expiresOn = expiresOn
        this.deleteOnView = deleteOnView
        this.raw = raw
        this.id = id
        if (!createdOn) this.createdOn = Date()
        else this.createdOn = createdOn
        this.uid = uid
        this.tempFilename = tempFilename
        this.mimeType = mimeType
        this.deleted = deleted
        this.textType = textType
        this.ip = ip
        if (viewsLeft != null) {
            this.viewsLeft = viewsLeft
        } else {
            if (this.isImage()) this.viewsLeft = 2
            else this.viewsLeft = 1
        }
        this.views = views
    }

    /**
     * Checks for links table in the database and creates it if not found.
     */
    static async init() {
        await db
            .run(
                "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, content TEXT, type TEXT, created_on INTEGER, expires_on INTEGER, delete_on_view INTEGER, raw INTEGER, mime_type TEXT, deleted INTEGER, views_left INTEGER, text_type TEXT, views INTEGER, ip INTEGER);"
            )
            .then((result) => {
                debug("Checked/created table links")
            })
            .catch((err) => {
                error(`Error creating table links: ${err}`)
            })
    }

    /**
     * Helper function for converting database link rows into a Link object
     * @param {*} dbLink - A dictionary of values from the db.get function
     * @returns {Link} A newly created Link object
     */
    static fromDb(dbLink) {
        const link = new Link(
            dbLink["content"],
            dbLink["type"],
            dbLink["expires_on"] ? Date(parseInt(dbLink["expires_on"])) : null,
            dbLink["delete_on_view"] == 1 ? true : false,
            dbLink["raw"] == 1 ? true : false,
            dbLink["text_type"],
            dbLink["ip"],
            "",
            dbLink["mime_type"],
            dbLink["id"],
            Date(parseInt(dbLink["created_on"])),
            dbLink["uid"],
            dbLink["deleted"] == 1 ? true : false,
            parseInt(dbLink["views_left"]),
            parseInt(dbLink["views"])
        )
        return link
    }

    /**
     * Checks whether a file link is one of the supported image types
     * @returns true if the mime type of the file is an image
     */
    isImage() {
        const mime = this.mimeType
        return (
            mime == "image/jpeg" ||
            mime == "image/apng" ||
            mime == "image/avif" ||
            mime == "image/png" ||
            mime == "image/gif" ||
            mime == "image/svg+xml" ||
            mime == "image/webp"
        )
    }

    /**
     * Checks whether a link's type is file
     */
    isFile() {
        return this.type == "file"
    }

    /**
     * Checks whether a link's type is text
     */
    isText() {
        return this.type == "text"
    }

    /**
     * Checks whether a link's type is link(url)
     */
    isUrl() {
        return this.type == "link"
    }

    /**
     * Splits the content lines into an array for use by templates
     * @returns {[String]} An array containing strings for each row of text/code
     */
    rows() {
        return this.content.split("\n")
    }

    /**
     * Calculates the approximate size of a link's data stored on disk
     * @returns {Number} The size in bytes
     */
    size() {
        if (this.type == "file") {
            if (this.uid != "") {
                const filePath = "./files/" + this.uid + "/" + this.content
                try {
                    const stats = fs.statSync(filePath)
                    return stats.size
                } catch (err) {
                    debug(err)
                    return 0
                }
            } else {
                return 0
            }
        } else {
            return this.content.length
        }
    }

    /**
     * Crops long content down to 48 characters with an ellipsis
     * @returns {String} A short version of the content
     */
    shortContent() {
        const shortContent = this.content.substr(0, 48)
        if (shortContent.length != this.content.length) {
            return shortContent + "..."
        }
        return this.content
    }

    /**
     * Deletes this link, removing the associated file if it is of type
     * file. The database entry will remain as an inactive link.
     */
    async delete() {
        // Delete file if file exists
        if (this.type == "file") {
            const baseDir = "./files/" + this.uid
            if (fs.existsSync(baseDir)) {
                debug("Attempting to unlink: " + baseDir)
                fs.rmSync(baseDir, { recursive: true, force: true }, (err) => {
                    if (err) error(err)
                })
            }
        }
        this.deleted = true
        await this.update()
    }

    /**
     * Delete this link if delete-on-view is enabled and it has
     * run out of views
     * @returns {Promise}
     */
    async checkViewsLeft() {
        if (!this.deleteOnView) return
        if (this.viewsLeft <= 0) await this.delete()
    }

    /**
     * Increment the number of views a link has, while also decrementing
     * its views left if delete-on-view is enabled.
     */
    async access() {
        this.views = this.views + 1
        if (this.deleteOnView) {
            this.viewsLeft = this.viewsLeft - 1
        }
        await this.update()
    }

    /**
     * Retrieves an array of all undeleted rows in the links table
     * @returns {Promise} All undeleted rows of the links table
     */
    static async findAll() {
        const dbLinks = await db.all(
            `SELECT * FROM links WHERE deleted = 0`,
            []
        )
        let result = []
        for (const dbLink of dbLinks) {
            const link = Link.fromDb(dbLink)
            result.push(link)
        }
        return result
    }

    /**
     * Retrieves a link with the specified UID
     * @param {String} uid - The UID of the link to retrieve
     * @returns {Promise} Either the link, or null if not found
     */
    static async findByUid(uid) {
        const dbLink = await db.get(`SELECT * FROM links WHERE uid = ?`, [uid])
        if (dbLink) {
            let link = Link.fromDb(dbLink)
            return link
        } else {
            return null
        }
    }

    /**
     * Retrieves an array of all undeleted links in the links table
     * submitted from the specified IP address.
     * @param {String} ip - The address to retrieve links for
     * @returns {Promise} An array of matching links
     */
    static async findAllByIp(ip) {
        const dbLinks = await db.all(
            `SELECT * FROM links WHERE ip = ? AND deleted = 0`,
            [ip]
        )
        let result = []
        for (const dbLink of dbLinks) {
            const link = Link.fromDb(dbLink)
            result.push(link)
        }
        return result
    }

    /**
     * Checks whether a link is deleted or not
     * @returns true if the link is deleted
     */
    isDeleted() {
        if (this.deleted) {
            debug(`Link with UID ${this.uid} is deleted.`)
            return true
        }
        return false
    }

    /**
     * Checks whether a link is past its expiration date
     * @returns true if the link has expired
     */
    isExpired() {
        if (this.expiresOn && Date() > this.expiresOn) {
            debug(`Link with UID ${this.uid} is expired.`)
            return true
        }
        return false
    }

    /**
     * Checks if a link is past its expiration date, and deletes it
     * if it is
     */
    async checkExpiration() {
        if (!this.expiresOn) return
        if (this.isExpired()) {
            if (!this.isDeleted()) {
                debug(
                    `Link with UID ${this.uid} has not yet been deleted. Deleting...`
                )
                await this.delete()
            }
        }
    }

    /**
     * Saves a new link to the database, and for file type links, renames the
     * temporary uploaded file and moves it to the ./files directory.
     */
    async save() {
        if (this.uid == 0) {
            const uid = await this.generateUnusedUid()
            this.uid = uid
        }

        debug(`Saving link with UID ${this.uid}`)

        // If a file type, rename the uploaded temp file and save to /files directory
        if (this.type == "file") {
            const baseDir = "./files/" + this.uid
            if (!fs.existsSync(baseDir)) {
                debug("Making base dir: " + baseDir)
                fs.mkdirSync(baseDir)
                const newFilePath = baseDir + "/" + this.content
                debug(
                    "Renaming '" +
                        this.tempFilename +
                        "' to '" +
                        newFilePath +
                        "'"
                )
                fs.renameSync(this.tempFilename, newFilePath, (err) => {
                    if (err) throw err
                })
            }
        }

        await db.run(
            `INSERT INTO links (uid, content, type, created_on, expires_on, delete_on_view, raw, mime_type, deleted, views_left, text_type, views, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                this.uid,
                this.content,
                this.type,
                this.createdOn.getTime(),
                this.expiresOn ? this.expiresOn.getTime() : null,
                this.deleteOnView ? 1 : 0,
                this.raw ? 1 : 0,
                this.mimeType,
                this.deleted ? 1 : 0,
                this.viewsLeft,
                this.textType,
                this.views,
                this.ip,
            ]
        )
        const results = await db.get("SELECT last_insert_rowid();")
        this.id = results["last_insert_rowid()"]
    }

    /**
     * Updates the data for a link already saved in the database.
     */
    async update() {
        try {
            debug(`Going to update link with new data: ${JSON.stringify(this)}`)
            await db.run(
                `UPDATE links SET content = ?, type = ?, created_on = ?, expires_on = ?, delete_on_view = ?, raw = ?, mime_type = ?, deleted = ?, views_left = ?, text_type = ?, views = ?, ip = ? WHERE uid = ?`,
                [
                    this.content,
                    this.type,
                    this.createdOn.getTime(),
                    this.expiresOn ? this.expiresOn.getTime() : null,
                    this.deleteOnView ? 1 : 0,
                    this.raw ? 1 : 0,
                    this.mimeType,
                    this.deleted ? 1 : 0,
                    this.viewsLeft,
                    this.textType,
                    this.views,
                    this.ip,
                    this.uid,
                ]
            )
        } catch (err) {
            error(err)
        }
        return this
    }

    /**
     * Attempts to generate a random UID not yet used by a link
     * in the database. It will make 10 attempts before failing.
     * @returns {String} A new, unused UID
     */
    async generateUnusedUid() {
        let uid
        let attempts = 1
        while (true) {
            uid = genUid(URL_LENGTH)
            if (!(await Link.findByUid(uid))) {
                break
            }
            if (attempts > MAX_GEN_TRIES)
                throw new Error("Exceeded max attempts to generate unique UID")
            attempts += 1
        }
        return uid
    }
}

Link.init()
