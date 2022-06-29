import rateLimiter from "./rateLimiter.mjs"
import supertest from "supertest"
import express from "express"

let app

describe("rateLimiter", () => {
    describe("given a rateLimiter configured to limit to 1 access every second", () => {
        beforeEach(() => {
            app = express()
            const limiter = rateLimiter({window: 1000, limit: 1 })
            app.get("/", limiter, (req, res) => {
                res.status(200)
                return res.send("Good")
            })
            app.use((err, req, res, next) => {
                const status = res.statusCode ? res.statusCode : 500
                res.status(status)
                return res.send(err.message)
            })
        })
        it("should accept the first request", async () => {
            const result = await supertest(app)
                .get("/")
            expect(result.status).toBe(200)
            expect(result.text).toMatch(/Good/)
        })
        it("should reject the second request with a 429 error", async () => {
            let result = await supertest(app)
                .get("/")
            result = await supertest(app)
                .get("/")
            expect(result.status).toBe(429)
            expect(result.text).toMatch(/Too many requests/)
        })
    })
})