import { debug } from "./logger.mjs"
import Date from "./date.mjs"

const defaultCacheDuration = process.env.CACHE_DURATION_IN_SECONDS * 1000 || 3600 * 1000

/**
 * Utility class to write and read data to/from a memcache store.
 */
export default class MemCache {
    constructor() {
        this.cache = {}
    }

    /**
     * Attempts to retrieve cached data stored with the specified key
     * @param {String} key - The unique identifier for the data
     * @returns {*} The cached data, or null if not yet cached
     */    
    read(key) {
        let result = this.cache[key]
        if (result) {
            if(new Date() > result.expires) {
                debug(`Cache with key ${key} has expired`)
                delete this.cache[key]
                return null
            }
            debug(`Using cache for key: ${key}`)
            return result.data
        }
        return null
    }

    /**
     * Stores the provided data in the memory cache under the specified key
     * @param {String} key - A unique identifier for the data
     * @param {*} data - The data to be cached
     * @param {Number} specifiedDuration - ms after which the cache item should be delted
     */
    write(key, data, specifiedDuration = defaultCacheDuration ) {
        const deleteDateTime = new Date(new Date().getTime() + specifiedDuration)
        this.cache[key] = { data: data, expires: deleteDateTime }
    }
}