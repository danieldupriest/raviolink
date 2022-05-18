const fs = require("fs");
const logFile = fs.createWriteStream("./debug.log", { flags: "w" });

module.exports = function (req, res, next) {
    logFile.write("Handling request to: " + req.url);
    console.log("Handling request to: " + req.url);
    console.log("  With Params: " + JSON.stringify(req.params));
    console.log("  With Body: " + JSON.stringify(req.body));
    next();
};
