import supertest from "supertest"
import createApp from "../app.mjs"
import Database from "../database/Database.mjs"
import { log } from "../utils/logger.mjs"
import Link from "../database/Link.mjs"
import jest from "jest"

let db, app

beforeAll((done) => {
    db = Database.instance("default", true)
    app = createApp()
    done()
})

afterAll((done) => {
    db.close().then(done)
})

describe("normal pages", () => {
    test("render home page", async () => {
        const { status, text } = await supertest(app).get("/")
        expect(status).toBe(200)
        expect(text.includes("URL")).toBe(true)
    })
    describe("given a request for missing content", () => {
        it("should show a 404 error", async () => {
            const { text, status } = await supertest(app).get("/abc.html")
            expect(status).toBe(404)
        })
    })
})
describe("creating links", () => {
    describe("url type", () => {
        describe("given a correct request", () => {
            it("should display detail page", async () => {
                const data = {
                    content: "http://google.com",
                    type: "link",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(201)
                expect(text).toMatch(/google.com/)
            })
        })
        describe("given a request with a missing parameter", () => {
            it("should show a 400 error", async () => {
                const data = {
                    content: "http://google.com",
                    type: "link",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(400)
                expect(text).toMatch(/parameters/)
            })
        })
        describe("given a request with an unsupported URL", () => {
            it("should show a 400 error", async () => {
                const data = {
                    content: `http://google.com/'`,
                    type: "link",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(400)
                expect(text).toMatch(/unsupported/)
            })
        })
    })
    describe("text type", () => {
        describe("given a correct request", () => {
            it("should display detail page", async () => {
                const data = {
                    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
                    type: "text",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(201)
                expect(text).toMatch(/Lorem ipsum/)
            })
        })
        describe("given a request with more than 500,000 characters in the content field", () => {
            it("should show a 413 error", async () => {
                const tooManyChars = new Array(600000).fill("a").join("")
                const data = {
                    content: tooManyChars,
                    type: "text",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(413)
                expect(text).toMatch(/too large/)
            })
        })
    })
})
