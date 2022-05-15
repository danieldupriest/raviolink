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
        expiresOn = null,
        id = 0,
        createdOn = null,
        uid = ""
    ) {
        this.content = content;
        this.type = type;
        this.expiresOn = expiresOn;
        this.id = id;
        if (!createdOn) this.createdOn = new RavioliDate(RavioliDate.now());
        else this.createdOn = createdOn;
        this.uid = uid;
    }

    toJSON() {
        const result = {
            content: this.content,
            type: this.type,
            expiresOn: this.expiresOn == null ? "never" : this.expiresOn,
            createdOn: this.createdOn,
            id: this.id,
            uid: this.uid,
        };
        return result;
    }

    async delete() {
        console.log(`Deleting link with id: ${this.id}`);
        await run("DELETE FROM links WHERE uid = ?", [this.uid]);
    }

    static async findByUid(uid) {
        console.log("Searching for uid: " + uid);
        const dbLink = await get(`SELECT * FROM links WHERE uid = ?`, [uid]);
        if (dbLink) {
            let result = new Link(
                dbLink["content"],
                dbLink["type"],
                new RavioliDate(parseInt(dbLink["expires_on"])),
                dbLink["id"],
                new RavioliDate(parseInt(dbLink["created_on"])),
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
            `INSERT INTO links (uid, content, type, created_on, expires_on) VALUES (?, ?, ?, ?, ?)`,
            [
                this.uid,
                this.content,
                this.type,
                this.createdOn.getTime(),
                this.expiresOn ? this.expiresOn.getTime() : null,
            ]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved link: " + JSON.stringify(this, null, 2));
    }

    async generateUnusedUid() {
        let uid;
        let attempts = 1;
        while (true) {
            uid = genUid(URL_LENGTH);
            if (!(await Link.findByUid(uid))) {
                console.log("UID is available.");
                break;
            }
            if (attempts > MAX_GEN_TRIES)
                throw new Error("Exceeded max attempts to generate unique UID");
            attempts += 1;
        }
        console.log("Generated UID: " + uid);
        return uid;
    }
}
module.exports = Link;
