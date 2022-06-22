import { debug } from "./logger"
import memcache from "memory-cache"

const duration = process.env.CACHE_DURATION_IN_SECONDS * 1000 || 3600 * 1000

export default {
    /**
     * Attempts to retrieve cached data stored with the specified key
     * @param {String} key - The unique identifier for the data
     * @returns {*} The cached data, or null if not yet cached
     */
    read: (key) => {
        let data = memcache.get(key)
        if (data) {
            debug(`Using cache for key: ${key}`)
            return data
        }
        return null
    },
    /**
     * Stores the provided data in the memory cache under the specified key
     * @param {String} key - A unique identifier for the data
     * @param {*} data - The data to be cached
     */
    write: (key, data) => {
        memcache.put(key, data, duration)
    },
}
