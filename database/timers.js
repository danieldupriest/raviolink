import db from "./database";

const GROWTH_RATE = 10.0;

// Dataclass to store links
export default class Timer {
    constructor(ip) {
        this.ip = ip;
        this.delay_in_ms = 1;
        this.revert_time = new Date().getTime();
    }

    findByIp(ip) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM timers WHERE ip = ?;",
            [this.ip],
            (err, rows) => {
                if(err)
                    reject(new Error("Error retrieving timer by IP.");
                resolve(rows);
            });
        });
    }

    save() {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(
                    `INSERT INTO timers (ip, delay_in_ms, revert_time) VALUES (?, ?, ?)`,
                    [this.ip, this.delay_in_ms, this.revert_time],
                    (err) => {
                        reject(new Error("Error while inserting timer."));
                    }
                );
                db.get("SELECT last_insert_rowid();", (err, result) => {
                    if(err) {
                        reject(new Error("Error getting timer id."));
                    }
                    this.id = result;
                });
            })
            resolve(this);
        });
    }

    canPost() {
        const now = new Date().getTime();
        return now > this.revert_time;
    }

    async increaseDelay() {
        const now = new Date().getTime();
        this.delay_in_ms *= GROWTH_RATE;
        this.revert_time = now + this.delay_in_ms;
        await this.save();
    }
    
    async decreaseDelay() {
        const now = new Date().getTime();
        this.delay_in_ms = max(1, parseInt(this.delay_in_ms / GROWTH_RATE));
        this.revert_time = now + this.delay_in_ms;
        await this.save();
    }
}