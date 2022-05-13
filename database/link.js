import { run, all, get } from "./database.js";
import crypto from "node:crypto";

const URL_LENGTH = 7;
const MAX_TRIES = 10;

// Dataclass to store links
class Link {
    constructor(content, type, id = 0) {
        this.content = content;
        this.type = type;
        this.createdOn = new Date().getTime();
        this.id = id;
    }

    static async findByHash(hash) {
        console.log("Searching for hash: " + hash);
        const result = get(`SELECT * FROM links WHERE url = ?`, [hash]);
        console.log("Results: " + JSON.stringify(result));
        return result;
    }

    async save() {
        const hash = await this.generateUnusedHash();
        this.url = hash;
        await run(
            `INSERT INTO links (url, content, type, created_on) VALUES (?, ?, ?, ?)`,
            [this.url, this.content, this.type, this.createdOn]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved link: " + JSON.stringify(this));
    }

    async hashInDatabase(hash) {
        const result = await this.findByHash(hash);
        if (result) return true;
        return false;
    }

    async generateUnusedHash() {
        let hash;
        let attempts = 1;
        while (true) {
            const time = new Date().getTime();
            hash = this.hash(this.content + time);
            if (!(await this.hashInDatabase(hash))) break;
            if (attempts > MAX_TRIES)
                throw new Error(
                    "Exceeded max attempts to generate unique hashs"
                );
            attempts += 1;
        }
        console.log("Generated hash: " + hash);
        return hash;
    }

    hash(data) {
        const hash = crypto.createHash("shake256", {
            outputLength: URL_LENGTH,
        });
        hash.update(data);
        return hash.digest("hex");
    }
}
export default Link;
