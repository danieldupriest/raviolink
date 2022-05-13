import { run, all, get } from "./database.js";

const INITIAL_DELAY = 1000;
const GROWTH_RATE = 10.0;

// Dataclass to store links
export default class Timer {
    constructor(ip) {
        this.ip = ip;
        this.delay_in_ms = INITIAL_DELAY;
        this.revert_time = new Date().getTime();
    }

    findByIp(ip) {
        return all("SELECT * FROM timers WHERE ip = ?;", [this.ip]);
    }

    async save() {
        await run(
            `INSERT INTO timers (ip, delay_in_ms, revert_time) VALUES (?, ?, ?)`,
            [this.ip, this.delay_in_ms, this.revert_time]
        );
        const results = await get("SELECT last_insert_rowid();");
        this.id = results["last_insert_rowid()"];
        console.log("Saved timer: " + JSON.stringify(this));
    }

    async update() {
        await run(
            "UPDATE timers SET (ip = ?, delay_in_ms = ?, revert_time = ?) WHERE id = ?;",
            [this.ip, this.delay_in_ms, this.revert_time, this.id]
        );
        console.log("Updated timer: " + JSON.stringify(this));
    }

    canPost() {
        const now = new Date().getTime();
        return now > this.revert_time;
    }

    async increaseDelay() {
        const now = new Date().getTime();
        this.delay_in_ms *= GROWTH_RATE;
        this.revert_time = now + this.delay_in_ms;
        await this.update();
    }

    async decreaseDelay() {
        const now = new Date().getTime();
        this.delay_in_ms = Math.max(
            1,
            parseInt(this.delay_in_ms / GROWTH_RATE)
        );
        this.revert_time = now + this.delay_in_ms;
        await this.update();
    }
}
