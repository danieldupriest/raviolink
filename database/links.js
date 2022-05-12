import db from "./database";
import crypto from "node:crypto";

const URL_LENGTH = 7;
const MAX_TRIES = 10;

// Dataclass to store links
export default class Link {
    constructor(content) {
        this.url = this.findHash(content);
        this.content = content;
    }

    save() {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(
                    `INSERT INTO links (url, content) VALUES (?, ?)`,
                    [this.url, this.content],
                    (err) => {
                        reject(new Error("Error while inserting link."));
                    }
                );
                db.get("SELECT last_insert_rowid();", (err, result) => {
                    if(err) {
                        reject(new Error("Error getting links id."));
                    }
                    resolve(result);
                });
            })
            
        })
    }

    findHash(content) {
        let hash = this.createHash(content, URL_LENGTH);
        let attempts = 1;
        while (this.hashInDatabase(hash)) {
            if (attempts > MAX_TRIES)
                throw new Error("Exceeded max attempts to generate unique hashs");
            content += "0";
            hash = this.createHash(content, URL_LENGTH);
            attempts += 1;
        }
        return hash
    }

    createHash(data, len) {
        const hash = crypto.createHash("shake256", { outputLength: len });
        hash.update(data);
        return hash.digest("hex");
    }

    hashInDatabase(hash) {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM links WHERE url = ?`, [hash], (err, rows) => {
                if (err) {
                    reject(new Error(`Error checking for hash: ${err.message}`);
                }
                if (rows.length > 0)
                    resolve(true);
                else
                    resolve(false);
            });
        });
    }
}