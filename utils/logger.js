const fs = require("fs");
const path = require("path");
const RavioliDate = require("./dates.js");

const environment = process.env.NODE_ENV || "development";
const fullPath = path.resolve(__dirname, "..");
const logFile = fs.createWriteStream(fullPath + "/debug.log");

const log = (input) => {
    const d = new RavioliDate();
    logFile.write(d.toISODate() + ": " + input + "\n");
};

const debug = (input) => {
    if (environment == "development") console.debug(input);
};

const error = (input) => {
    console.error(input);
};

module.exports = { log, debug, error };
