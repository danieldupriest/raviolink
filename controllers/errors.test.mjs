import supertest from "supertest"
import express from "express"
import { missingErrorResponder, customErrorResponder } from "./errors.mjs"
import mustacheExpress from "mustache-express"

let app

beforeEach(() => {
    app = express()
    app.set("views", "./views")
    app.set("view engine", "mustache")
    app.engine("mustache", mustacheExpress())
})

describe("missingErrorResponder", () => {
    describe("given a request for a non-existent resource", () => {
        it("should display a 404 error", async () => {
            app.use(missingErrorResponder)
            app.use((err, req, res, next) => {
                const statusCode = res.statusCode === 200 ? 500 : res.statusCode
                res.status(statusCode)
                return res.send(err.message)
            })
            const { text, status } = await supertest(app)
                .get("/abc.html")
            expect(status).toBe(404)
        })
    })
})

describe("customErrorResponder", () => {
    describe("given a specific error occurred during some middleware, such as 413", () => {
        it("should display the http code and error message", async () => {
            app.use((req, res, next) => {
                res.statusCode = 413
                next(new Error("User-facing error message"))
            })
            app.use(customErrorResponder)
            const { text, status } = await supertest(app)
                .get("/")
            expect(status).toBe(413)
            expect(text).toMatch(/error message/)
        })
    })
    describe("given an uncaught error during some middleware", () => {
        it("should display the http code 500 and generic error message", async () => {
            app.use((req, res, next) => {
                next(new Error("User-facing error message"))
            })
            app.use(customErrorResponder)
            const { text, status } = await supertest(app)
                .get("/")
            expect(status).toBe(500)
            expect(text).toMatch(/error message/)
        })
    })
})