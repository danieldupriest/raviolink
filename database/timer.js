const { run, all, get } = require("./database.js");
const toAmericanDate = require("../utils/dates.js");

const INITIAL_DELAY = 1000;
const GROWTH_RATE = 10.0;

// Dataclass to store links
class Timer {
    constructor(
        ip,
        id = 0,
        delayInMs = INITIAL_DELAY,
        revertTime = null,
        createdOn = null
    ) {
        this.id = id;
        this.ip = ip;
        this.delayInMs = delayInMs;
        if (!revertTime)
            this.revertTime = new Date(new Date().getTime() + INITIAL_DELAY);
        else this.revertTime = revertTime;
        if (!createdOn) this.createdOn = new Date();
        else this.createdOn = createdOn;
    }

    toJSON() {
        return {
            id: this.id,
            ip: this.ip,
            delay: this.delayInMs,
            revertTime: toAmericanDate(this.revertTime),
            createdOn: toAmericanDate(this.createdOn),
        };
    }

    async findByIp(ip) {
        console.log("Searching for timer with ip: " + ip);
        const timer = await get(`SELECT * FROM timers WHERE ip = ?`, [ip]);
        if (timer) {
            let result = new Timer(
                dbLink["ip"],
                dbLink["id"],
                dbLink["delay_in_ms"],
                new Date(dbLink["revert_time"]),
                new Date(dbLink["created_on"])
            );
            return result;
        } else {
            return null;
        }
    }

    async save() {
        await run(
            `INSERT INTO timers (ip, delay_in_ms, revert_time, created_on) VALUES (?, ?, ?, ?)`,
            [
                this.ip,
                this.delayInMs,
                this.revertTime.getTime(),
                this.createdOn.getTime(),
            ]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved timer: " + JSON.stringify(this));
        return this;
    }

    async update() {
        await run(
            "UPDATE timers SET (ip = ?, delay_in_ms = ?, revert_time = ?, created_on = ?) WHERE id = ?;",
            [
                this.ip,
                this.delayInMs,
                this.revertTime.getTime(),
                this.createdOn.getTime(),
                this.id,
            ]
        );
        console.log("Updated timer: " + JSON.stringify(this));
        return this;
    }

    canPost() {
        return new Date() > this.revertTime;
    }

    async increaseDelay() {
        const now = new Date().getTime();
        this.delayInMs *= GROWTH_RATE;
        this.revertTime = new Date(now + this.delayInMs);
        await this.update();
    }

    async decreaseDelay() {
        const now = new Date().getTime();
        this.delayInMs = Math.max(
            INITIAL_DELAY,
            parseInt(this.delayInMs / GROWTH_RATE)
        );
        this.revertTime = new Date(now + this.delaYInMs);
        await this.update();
    }
}

module.exports = Timer;
