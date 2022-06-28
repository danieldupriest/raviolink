import supertest from "supertest"
import createApp from "../app.mjs"
import Database from "../database/Database.mjs"
import path from "path"
import { fileExistsRecursive } from "../utils/tools.mjs"
import Link from "../database/Link.mjs"
import fs from "fs"

const testImagePath = "./public/images/logo.png"

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
    afterEach(async () => {
        await Link.hardDeleteAll()
    })
    describe("all types", () => {
        describe("given a request with a missing content parameter", () => {
            it("should show a 400 error", async () => {
                const data = {
                    expiration: "never",
                    type: "link",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(400)
                expect(text).toMatch(/parameters/)
            })
        })
        describe("given a request with a missing type parameter", () => {
            it("should show a 400 error", async () => {
                const data = {
                    content: "http://google.com",
                    expiration: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(400)
                expect(text).toMatch(/parameters/)
            })
        })
        describe("given a request with a missing expiration parameter", () => {
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
    })
    describe("url type", () => {
        describe("given a correct request", () => {
            it("should display URL detail page", async () => {
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
            it("should display text detail page", async () => {
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
    describe("file type", () => {
        describe("given a correct request", () => {
            it("should display detail page", async () => {
                const { status, text } = await supertest(app)
                    .post("/")
                    .attach("content", testImagePath)
                    .field("content", "logo.png")
                    .field("type", "file")
                    .field("expires", "never")
                expect(status).toBe(201)
                expect(text).toMatch(/logo.png/)
            })
        })
        describe("given a correct request", () => {
            it("uploaded file should exist", async () => {
                const { status, text } = await supertest(app)
                    .post("/")
                    .attach("content", testImagePath)
                    .field("content", "logo.png")
                    .field("type", "file")
                    .field("expires", "never")
                const fileThatShouldExist = testImagePath.split("/").pop()
                const fileExists = fileExistsRecursive(
                    fileThatShouldExist,
                    "./files/"
                )
                expect(fileExists).toBe(true)
            })
        })
        describe("given a request with missing file", () => {
            it("should show 400 error", async () => {
                const data = {
                    content: "logo.png",
                    type: "file",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(400)
                expect(text).toMatch(/must contain a file/)
            })
        })
        describe("given a request with too large a file", () => {
            it("should display a 413 error", async () => {
                const tooBig = parseInt(process.env.MAX_UPLOAD_SIZE) + 1
                const chars = new Array(tooBig).fill("0").join("")

                fs.writeFileSync("./files/temp.txt", chars)
                const { status, text } = await supertest(app)
                    .post("/")
                    .attach("content", "./files/temp.txt")
                    .field("content", "temp.txt")
                    .field("type", "file")
                    .field("expires", "never")
                expect(status).toBe(413)
                expect(text).toMatch(/too large/)
                fs.unlinkSync("./files/temp.txt")
            })
        })
    })
})
