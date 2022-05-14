const { run, all, get } = require("./database.js");
const genUid = require("../utils/genUid.js");

const URL_LENGTH = 7;
const MAX_GEN_TRIES = 10;

// Dataclass to store links
class Link {
    constructor(content, type, id = 0, createdOn = null, uid = "") {
        this.content = content;
        this.type = type;
        this.id = id;
        if (!createdOn) this.createdOn = new Date();
        else this.createdOn = createdOn;
        this.uid = uid;
    }

    static async findByUid(uid) {
        console.log("Searching for uid: " + uid);
        const dbLink = await get(`SELECT * FROM links WHERE uid = ?`, [uid]);
        if (dbLink) {
            let result = new Link(
                dbLink["content"],
                dbLink["type"],
                dbLink["id"],
                new Date(parseInt(dbLink["created_on"])),
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
            `INSERT INTO links (uid, content, type, created_on) VALUES (?, ?, ?, ?)`,
            [this.uid, this.content, this.type, this.createdOn.getTime()]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved link: " + JSON.stringify(this));
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
