const fs = require("fs");
const path = require("path");
const fullPath = path.resolve(__dirname, "..");

const logFile = fs.createWriteStream(fullPath + "/debug.log");

const log = (input) => {
    logFile.write(input + "\n");
};

const debug = (input) => {
    console.debug(input);
};

const error = (input) => {
    console.error(input);
};

module.exports = { log, debug, error };
