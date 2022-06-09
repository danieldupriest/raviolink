require("dotenv").config();
const Database = require("./Database.js");
const genUid = require("../utils/genUid.js");
const RavioliDate = require("../utils/dates.js");
const fs = require("fs");
const { threadId } = require("worker_threads");
const { formatBytes } = require("../utils/tools.js");

const URL_LENGTH = 7;
const MAX_GEN_TRIES = 10;

const db = new Database();

// Dataclass to store links
class Link {
    constructor(
        content,
        type,
        expiresOn,
        deleteOnView,
        raw,
        textType,
        tempFilename = "",
        mimeType = "",
        id = 0,
        createdOn = null,
        uid = "",
        deleted = false,
        viewsLeft = null
    ) {
        this.content = content;
        this.type = type;
        this.expiresOn = expiresOn;
        this.deleteOnView = deleteOnView;
        this.raw = raw;
        this.id = id;
        if (!createdOn) this.createdOn = RavioliDate();
        else this.createdOn = createdOn;
        this.uid = uid;
        this.tempFilename = tempFilename;
        this.mimeType = mimeType;
        this.deleted = deleted;
        this.textType = textType;
        if (viewsLeft != null) {
            this.viewsLeft = viewsLeft;
        } else {
            if (this.isImage()) this.viewsLeft = 2;
            else this.viewsLeft = 1;
        }
    }

    isImage() {
        const mime = this.mimeType;
        return (
            mime == "image/jpeg" ||
            mime == "image/apng" ||
            mime == "image/avif" ||
            mime == "image/png" ||
            mime == "image/gif" ||
            mime == "image/svg+xml" ||
            mime == "image/webp"
        );
    }

    isFile() {
        return this.type == "file";
    }

    isText() {
        return this.type == "text";
    }

    isCode() {
        return this.textType != "plain";
    }

    isUrl() {
        return this.type == "link";
    }

    rows() {
        return this.content.split("\n");
    }

    size() {
        if (this.type == "file") {
            if (this.uid != "") {
                try {
                    const filePath = "./files/" + this.uid + "/" + this.content;
                    const stats = fs.statSync(filePath);
                    return formatBytes(stats.size);
                } catch (err) {
                    throw err;
                }
            } else {
                return "";
            }
        } else {
            return formatBytes(this.content.length);
        }
    }

    shortContent() {
        const shortContent = this.content.substr(0, 48);
        if (shortContent.length != this.content.length) {
            return shortContent + "...";
        }
        return this.content;
    }

    async delete() {
        this.deleted = true;

        // Delete file if file
        if (this.type == "file") {
            const baseDir = "./files/" + this.uid;
            console.log("Attempting to unlink: " + baseDir);
            try {
                fs.rmSync(baseDir, { recursive: true, force: true });
            } catch (err) {
                throw err;
            }
        }

        await this.update();
    }

    async checkViewsLeft() {
        if (!this.deleteOnView) return;
        if (this.viewsLeft <= 0) await this.delete();
    }

    async decrementViewsLeft() {
        console.log("ViewsLeft: " + this.viewsLeft);
        if (!this.deleteOnView) return;
        this.viewsLeft = this.viewsLeft - 1;
        await this.update();
        console.log("ViewsLeft after: " + this.viewsLeft);
    }

    static async findAll() {
        const dbLinks = await db.all(
            `SELECT * FROM links WHERE deleted = 0`,
            []
        );
        let result = [];
        for (const dbLink of dbLinks) {
            let link = new Link(
                dbLink["content"],
                dbLink["type"],
                dbLink["expires_on"]
                    ? RavioliDate(parseInt(dbLink["expires_on"]))
                    : null,
                dbLink["delete_on_view"] == 1 ? true : false,
                dbLink["raw"] == 1 ? true : false,
                dbLink["text_type"],
                "",
                dbLink["mime_type"],
                dbLink["id"],
                RavioliDate(parseInt(dbLink["created_on"])),
                dbLink["uid"],
                dbLink["deleted"] == 1 ? true : false,
                parseInt(dbLink["views_left"])
            );
            result.push(link);
        }
        return result;
    }

    static async findByUid(uid) {
        const dbLink = await db.get(`SELECT * FROM links WHERE uid = ?`, [uid]);
        if (dbLink) {
            let result = new Link(
                dbLink["content"],
                dbLink["type"],
                dbLink["expires_on"]
                    ? RavioliDate(parseInt(dbLink["expires_on"]))
                    : null,
                dbLink["delete_on_view"] == 1 ? true : false,
                dbLink["raw"] == 1 ? true : false,
                dbLink["text_type"],
                "",
                dbLink["mime_type"],
                dbLink["id"],
                RavioliDate(parseInt(dbLink["created_on"])),
                dbLink["uid"],
                dbLink["deleted"] == 1 ? true : false,
                parseInt(dbLink["views_left"])
            );
            return result;
        } else {
            return null;
        }
    }

    isDeleted() {
        return this.deleted;
    }

    isExpired() {
        return this.expiresOn && RavioliDate() > this.expiresOn;
    }

    async checkExpiration() {
        if (!this.expiresOn)
            // Expiration date is not set
            return;
        if (this.isExpired()) {
            console.log("Link is expired: " + this.uid);
            if (!this.isDeleted()) {
                console.log(
                    "Link has not yet been deleted. Deleting: " + this.uid
                );
                await this.delete();
            }
        }
    }

    async save() {
        //console.log(JSON.stringify(this));
        if (this.uid == 0) {
            const uid = await this.generateUnusedUid();
            this.uid = uid;
        }

        if (this.type == "file") {
            const baseDir = "./files/" + this.uid;
            //console.log("ExistsSync '" + baseDir + " : " + fs.existsSync(baseDir));
            if (!fs.existsSync(baseDir)) {
                console.log("Making base dir: " + baseDir);
                fs.mkdirSync(baseDir);
                const newFilePath = baseDir + "/" + this.content;
                console.log(
                    "Renaming '" +
                        this.tempFilename +
                        "' to '" +
                        newFilePath +
                        "'"
                );
                fs.renameSync(this.tempFilename, newFilePath, (err) => {
                    if (err) throw err;
                });
            }
        }

        await db.run(
            `INSERT INTO links (uid, content, type, created_on, expires_on, delete_on_view, raw, mime_type, deleted, views_left, text_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            ]
        );
        const results = await db.get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
    }

    async update() {
        //console.log("Updating: " + JSON.stringify(this));
        await db.run(
            `UPDATE links SET content = ?, type = ?, created_on = ?, expires_on = ?, delete_on_view = ?, raw = ?, mime_type = ?, deleted = ?, views_left = ?, text_type = ? WHERE uid = ?`,
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
                this.uid,
            ]
        );
        return this;
    }

    async generateUnusedUid() {
        let uid;
        let attempts = 1;
        while (true) {
            uid = genUid(URL_LENGTH);
            if (!(await Link.findByUid(uid))) {
                break;
            }
            if (attempts > MAX_GEN_TRIES)
                throw new Error("Exceeded max attempts to generate unique UID");
            attempts += 1;
        }
        return uid;
    }
}
module.exports = Link;
