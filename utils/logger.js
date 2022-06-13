const fs = require("fs");
const path = require("path");
const RavioliDate = require("./dates.js");

const fullPath = path.resolve(__dirname, "..");
const logFile = fs.createWriteStream(fullPath + "/debug.log");

const log = (input) => {
    const d = new RavioliDate();
    logFile.write(d.toISODate() + ": " + input + "\n");
};

const debug = (input) => {
    console.debug(input);
};

const error = (input) => {
    console.error(input);
};

module.exports = { log, debug, error };
