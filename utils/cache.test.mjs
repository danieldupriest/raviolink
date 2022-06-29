import Cache from "./cache.mjs"
import { sleep } from "./tools.mjs"

describe("Cache", () => {
    describe("given new, uncashed data", () => {
        it("read should return null", () => {
            const cache = new Cache()
            const key = "abc"
            const result = cache.read(key)
            expect(result).toBe(null)
        })
    })
    describe("given cached string", () => {
        it("read should return the string data", () => {
            const cache = new Cache()
            const key = "abc"
            const data = "123"
            cache.write(key, data)
            const result = cache.read(key)
            expect(result).toBe("123")
        })
    })
    describe("given cached object", () => {
        it("read should return the data", () => {
            const cache = new Cache()
            const key = "abc"
            const data = { a: 1, b: "test", c: false }
            cache.write(key, data)
            const result = cache.read(key)
            expect(result).toEqual({ a: 1, b: "test", c: false })
        })
    })
    describe("given a read for a cached object that has expired", () => {
        it("read should return null", async () => {
            const cache = new Cache()
            const key = "abc"
            const data = "123"
            cache.write(key, data, 100)
            await sleep(150)
            const result = cache.read(key)
            expect(result).toBe(null)
        })
    })
})