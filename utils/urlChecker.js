const url = require("url");

const urlChecker = (input) => {
    try {
        const newUrl = url.parse(input);
    } catch {
        return false;
    }
    return true;
};

module.exports = urlChecker;
