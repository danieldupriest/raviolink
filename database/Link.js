require("dotenv").config();
const Database = require("./Database.js");
const genUid = require("../utils/genUid.js");
const RavioliDate = require("../utils/dates.js");
const fs = require("fs");
const { threadId } = require("worker_threads");

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
        if (viewsLeft) {
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

    toJSON() {
        const result = {
            content: this.content,
            type: this.type,
            expiresOn: this.expiresOn,
            deleteOnView: this.deleteOnView,
            createdOn: this.createdOn,
            id: this.id,
            uid: this.uid,
            raw: this.raw,
            tempFilename: this.tempFilename,
            mimeType: this.mimeType,
            deleted: this.deleted,
            viewsLeft: this.viewsLeft,
            textType: this.textType,
            textClass:
                this.textType == "plain"
                    ? "nohighlight"
                    : "language-" + this.textType,
        };
        return result;
    }

    async decrementViewsLeft() {
        console.log("in decrementViewsLeft: " + this.viewsLeft);
        if (this.deleteOnView) {
            if (this.viewsLeft > 0) {
                this.viewsLeft -= 1;
                if (this.viewsLeft <= 0) {
                    this.deleted = true;
                }
                await this.update();
            }
        }
        console.log("After decrementViewsLeft: " + this.viewsLeft);
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
        if (this.deleted) console.log("Link is deleted.");
        return this.deleted;
    }

    isExpired() {
        if (this.expiresOn && RavioliDate() > this.expiresOn) {
            console.log("Link is expired.");
            return true;
        }
        return false;
    }

    async save() {
        console.log("Saving: " + JSON.stringify(this));
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
        console.log("Updating: " + JSON.stringify(this));
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
