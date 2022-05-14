const { run, all, get } = require("./database.js");
const sha256 = require("crypto-js/sha256");

const URL_LENGTH = 7;
const MAX_HASH_TRIES = 10;

// Dataclass to store links
class Link {
    constructor(content, type, id = 0, createdOn = null, hash = "") {
        this.content = content;
        this.type = type;
        this.id = id;
        if (!createdOn) this.createdOn = new Date();
        else this.createdOn = createdOn;
        this.hash = hash;
    }

    static async findByHash(hash) {
        console.log("Searching for hash: " + hash);
        const dbLink = await get(`SELECT * FROM links WHERE hash = ?`, [hash]);
        if (dbLink) {
            console.log("Found: " + JSON.stringify(dbLink));
            let result = new Link(
                dbLink["content"],
                dbLink["type"],
                dbLink["id"],
                new Date(parseInt(dbLink["createdOn"])),
                dbLink["hash"]
            );
            return result;
        } else {
            return null;
        }
    }

    async save() {
        const hash = await this.generateUnusedHash();
        this.hash = hash;
        await run(
            `INSERT INTO links (hash, content, type, created_on) VALUES (?, ?, ?, ?)`,
            [this.hash, this.content, this.type, this.createdOn.getTime()]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved link: " + JSON.stringify(this));
    }

    async hashInDatabase(hash) {
        const result = await Link.findByHash(hash);
        if (result) return true;
        return false;
    }

    async generateUnusedHash() {
        let hash;
        let attempts = 1;
        while (true) {
            const time = new Date().getTime();
            hash = this.hashOnce(this.content + time);
            if (!(await this.hashInDatabase(hash))) {
                console.log("Hash is available.");
                break;
            }
            if (attempts > MAX_HASH_TRIES)
                throw new Error(
                    "Exceeded max attempts to generate unique hashs"
                );
            attempts += 1;
        }
        console.log("Generated hash: " + hash);
        return hash;
    }

    hashOnce(data) {
        const hash = sha256(data).toString();
       	const short = hash.substring(0, URL_LENGTH);
        return short;
    }
}
module.exports = Link;
