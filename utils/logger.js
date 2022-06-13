const fs = require("fs");
const logFile = fs.createWriteStream("./debug.log", { flags: "w" });

module.exports["log"] = function (input) {
    logFile.write(input);
};

module.exports["debug"] = function (input) {
    console.debug(input);
};

module.exports["error"] = function (input) {
    console.error(input);
};
