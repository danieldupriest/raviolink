import db from "./database.js";
import crypto from "node:crypto";

const URL_LENGTH = 7;
const MAX_TRIES = 10;

// Dataclass to store links
export default class Link {
    constructor(content, type) {
        this.content = content;
        this.type = type;
        this.createdOn = new Date().getTime();
    }

    findByHash(hash) {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM links WHERE url = ?`, [hash], (err, rows) => {
                if (err) {
                    reject(err);
                }
                if (rows.length > 0) resolve(rows[0]);
                else reject(new Error("Hash not found"));
            });
        });
    }

    async hashInDatabase(hash) {
        try {
            await this.findByHash(hash);
        } catch {
            return false;
        }
        return true;
    }

    save() {
        return new Promise((resolve, reject) => {
            this.findHash(this.content)
                .then((hash) => {
                    this.url = hash;
                })
                .then(() => {
                    db.serialize(() => {
                        db.run(
                            `INSERT INTO links (url, content, type, created_on) VALUES (?, ?, ?, ?)`,
                            [this.url, this.content, this.type, this.createdOn],
                            (err) => {
                                reject(
                                    new Error("Error while inserting link.")
                                );
                            }
                        );
                        db.get("SELECT last_insert_rowid();", (err, result) => {
                            if (err) {
                                reject(new Error("Error getting links id."));
                            }
                            this.id = result;
                        });
                    });
                    resolve(this);
                });
        });
    }

    async findHash(content) {
        let hash;
        let attempts = 1;
        while (true) {
            hash = this.createHash(content, URL_LENGTH);
            if (!(await this.hashInDatabase(hash))) break;
            if (attempts > MAX_TRIES)
                throw new Error(
                    "Exceeded max attempts to generate unique hashs"
                );
            content += "0";
            attempts += 1;
        }
        return hash;
    }

    createHash(data, len) {
        const hash = crypto.createHash("shake256", { outputLength: len });
        hash.update(data);
        return hash.digest("hex");
    }
}
