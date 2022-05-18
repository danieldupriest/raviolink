const { run, all, get } = require("./database.js");
const genUid = require("../utils/genUid.js");
const RavioliDate = require("../utils/dates.js");

const URL_LENGTH = 7;
const MAX_GEN_TRIES = 10;

// Dataclass to store links
class Link {
    constructor(
        content,
        type,
        expiresOn,
        deleteOnView,
        raw,
        id = 0,
        createdOn = null,
        uid = ""
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
    }

    toJSON() {
        const result = {
            content: this.content,
            type: this.type,
            expiresOn: this.expiresOn ? this.expiresOn : "never",
            deleteOnView: this.deleteOnView,
            createdOn: this.createdOn,
            id: this.id,
            uid: this.uid,
            raw: this.raw,
        };
        return result;
    }

    async delete() {
        console.log(`Deleting link with id: ${this.id}`);
        await run("DELETE FROM links WHERE uid = ?", [this.uid]);
    }

    static async findByUid(uid) {
        const dbLink = await get(`SELECT * FROM links WHERE uid = ?`, [uid]);
        if (dbLink) {
            let result = new Link(
                dbLink["content"],
                dbLink["type"],
                dbLink["expires_on"]
                    ? RavioliDate(parseInt(dbLink["expires_on"]))
                    : null,
                dbLink["delete_on_view"] == 1 ? true : false,
                dbLink["raw"] == 1 ? true : false,
                dbLink["id"],
                RavioliDate(parseInt(dbLink["created_on"])),
                dbLink["uid"]
            );
            return result;
        } else {
            return null;
        }
    }

    async save() {
        const uid = await this.generateUnusedUid();
        this.uid = uid;
        await run(
            `INSERT INTO links (uid, content, type, created_on, expires_on, delete_on_view, raw) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                this.uid,
                this.content,
                this.type,
                this.createdOn.getTime(),
                this.expiresOn ? this.expiresOn.getTime() : null,
                this.deleteOnView ? 1 : 0,
                this.raw ? 1 : 0,
            ]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
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
