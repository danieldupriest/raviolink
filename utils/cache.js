const { debug } = require("./logger.js");
const memcache = require("memory-cache");
const duration = process.env.CACHE_DURATION_IN_SECONDS * 1000 || 3600 * 1000;

module.exports = {
    read: (key) => {
        let data = memcache.get(key);
        if (data) {
            debug(`Using cache for key: ${key}`);
            return data;
        }
        return null;
    },
    write: (key, data) => {
        memcache.put(key, data, duration);
    },
};
