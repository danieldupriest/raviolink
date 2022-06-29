import supertest from "supertest"
import createApp from "../app.mjs"
import Database from "../database/Database.mjs"
import path from "path"
import { fileExistsRecursive, sleep } from "../utils/tools.mjs"
import { log } from "../utils/logger.mjs"
import Link from "../database/Link.mjs"
import fs from "fs"
import sharp from "sharp"

const testImagePath = "./testData/test.png"

function getUidFromText(text) {
    if (text.includes("content-image")) {
        try {
            const matched = text.match(/([a-zA-Z0-9]{7})\/file/gm)
            const uid = matched[0].substr(0, 7)
            return uid
        } catch (err) {
            return null
        }
    } else {
        try {
            const matched = text.match(/([a-zA-Z0-9]{7})<\/div>/gm)
            const uid = matched[0].substr(0, 7)
            return uid
        } catch (err) {
            return null
        }
    }
}

let db, app

beforeAll(() => {
    db = Database.instance("default", true)
    app = createApp()
})

afterEach(async () => {
    await Link.hardDeleteAll()    
})

afterAll(async () => {
    await db.close()
})

describe("normal pages", () => {
    test("render home page", async () => {
        const { status, text } = await supertest(app).get("/")
        expect(status).toBe(200)
        expect(text.includes("URL")).toBe(true)
    })
})
describe("creating links", () => {
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
        describe("given a request to create a link from a local machine", () => {
            it("should save a link with IP 127.0.0.1", async () => {
                const data = {
                    content: "http://google.com",
                    type: "link",
                    expires: "never",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                const uid = getUidFromText(text)
                const result = await supertest(app)
                    .get("/adminview/" + uid)
                expect(result.body.ip).toBe('127.0.0.1')
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
        describe("given a request with highlighting type of CSS selected", () => {
            it("should display the detail page with highlighting for css enabled", async () => {
                const data = {
                    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
                    type: "text",
                    expires: "never",
                    textType: "css",
                }
                const { status, text } = await supertest(app)
                    .post("/")
                    .send(data)
                expect(status).toBe(201)
                expect(text).toMatch(/language: "css"/)
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
        describe("filename sanitization", () => {
            beforeEach(() => {
                if (!fs.existsSync("./temp")) fs.mkdirSync("./temp")
            })
            afterEach(() => {
                fs.rmSync("./temp", { recursive: true })
            })
            const renamedStrings = [
                ["a\\", "a"],
                ["a\\\\", "a"],
                ["a.", "a"],
                ["<a>", "a"],
                ["a?", "a"],
                ["aa:aa", "aaaa"],
                ['"a', "a"],
                ['""a', "a"],
                ["|a", "a"],
                ["*a", "a"],
            ]
            for (const [key, value] of renamedStrings) {
                describe(`given a request with filename ${key}`, () => {
                    it(`should sanitize the filename to ${value}`, async () => {
                        fs.writeFileSync("./temp/" + key, "content")
                        const { status, text } = await supertest(app)
                            .post("/")
                            .attach("content", "./temp/" + key)
                            .field("content", key)
                            .field("type", "file")
                            .field("expires", "never")
                        const result = fileExistsRecursive(value, "./files/")
                        expect(result).toBe(true)
                    })
                })
            }
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
describe("viewing links", () => {
    describe("given a link set to display as raw", () => {
        describe("given the link is of type file, and the mimetype is image/png", () => {
            it("should display with content type of image/png", async() => {
                let result = await supertest(app)
                    .post("/")
                    .attach("content", testImagePath)
                    .field("content", "logo.png")
                    .field("type", "file")
                    .field("expires", "never")
                    .field("raw", "true")
                const uid = getUidFromText(result.text)
                result = await supertest(app)
                    .get("/" + uid)
                expect(result.status).toBe(200)
                expect(result.headers['content-type']).toBe('image/png')
            })
        })
        describe("given the link is of type text", () => {
            it("should display with content type of text/plain", async() => {
                const data = {
                    content: "This is plaintext",
                    expires: "never",
                    type: "text",
                    raw: "true",
                }
                let result = await supertest(app)
                    .post("/")
                    .send(data)
                const uid = getUidFromText(result.text)
                result = await supertest(app)
                    .get("/" + uid)
                expect(result.status).toBe(200)
                expect(result.headers['content-type']).toBe('text/plain; charset=utf-8')
            })
        })
    })
    describe("given a link with expiration time set to 300ms", () => {
        it("should display normally when accessed immediately", async () => {
            const data = {
                content: "http://google.com",
                type: "link",
                expires: "300",
            }
            let result = await supertest(app)
                .post("/")
                .send(data)
            const uid = getUidFromText(result.text)
            const {status, text} = await supertest(app)
                    .get("/" + uid)
            expect(status).toBe(301)
        })
        it("should show a 404 error after 350ms", async () => {
            const data = {
                content: "http://google.com",
                type: "link",
                expires: "300",
            }
            let result = await supertest(app)
                .post("/")
                .send(data)
            const uid = getUidFromText(result.text)
            await sleep(350)
            const {status, text} = await supertest(app)
                    .get("/" + uid)
            expect(status).toBe(404)
        })
    })
    describe("given a link set to delete on view", () => {
        it("should display normally once", async () => {
            const data = {
                content: "Some sample text",
                type: "text",
                expires: "never",
                deleteOnView: "true",
            }
            let result = await supertest(app)
                .post("/")
                .send(data)
            const uid = getUidFromText(result.text)
            const { status, text } = await supertest(app)
                .get("/" + uid)
            expect(status).toBe(200)
        })
        it("should show 404 error on second access", async () => {
            const data = {
                content: "Some sample text",
                type: "text",
                expires: "never",
                deleteOnView: "true",
            }
            let result = await supertest(app)
                .post("/")
                .send(data)
            const uid = getUidFromText(result.text)
            result = await supertest(app)
                .get("/" + uid)
            const { status, text } = await supertest(app)
                .get("/" + uid)
            expect(status).toBe(404)
        })
        describe("when file is an image", () => {
            it("should be accessible as a /file request the first 2 times", async () => {
                let result = await supertest(app)
                    .post("/")
                    .attach("content", testImagePath)
                    .field("content", "logo.png")
                    .field("type", "file")
                    .field("expires", "never")
                    .field("deleteOnView", "true")
                expect(result.status).toBe(201)
                const uid = getUidFromText(result.text)
                result = await supertest(app)
                    .get("/" + uid + "/file")
                expect(result.status).toBe(200)
                result = await supertest(app)
                    .get("/" + uid + "/file")
                expect(result.status).toBe(200)
            })
            it("should give a 404 error on the 3rd /file request", async () => {
                let result = await supertest(app)
                    .post("/")
                    .attach("content", testImagePath)
                    .field("content", "logo.png")
                    .field("type", "file")
                    .field("expires", "never")
                    .field("deleteOnView", "true")
                const uid = getUidFromText(result.text)
                result = await supertest(app)
                    .get("/" + uid + "/file")
                result = await supertest(app)
                    .get("/" + uid + "/file")
                result = await supertest(app)
                    .get("/" + uid + "/file")
                expect(result.status).toBe(404)
            })
        })
    })
    describe("given a request to resize an image to 100 px", () => {
        it("should render the resized image at 100 X 100 px", async () => {
            let result = await supertest(app)
                .post("/")
                .attach("content", testImagePath)
                .field("content", "logo.png")
                .field("type", "file")
                .field("expires", "never")
                .field("deleteOnView", "true")
            const uid = getUidFromText(result.text)
            result = await supertest(app)
                .get("/" + uid + "/file?size=100")
            const image = await sharp(result.body)
            const metadata = await image.metadata()
            expect(metadata.width).toBe(100)
            expect(metadata.height).toBe(100)
        })
    })
    describe("given a request to resize an image beyond the limit of 1920 px", () => {
        it("should show a 400 error stating the limit", async () => {
            let result = await supertest(app)
                .post("/")
                .attach("content", testImagePath)
                .field("content", "logo.png")
                .field("type", "file")
                .field("expires", "never")
                .field("deleteOnView", "true")
            const uid = getUidFromText(result.text)
            result = await supertest(app)
                .get("/" + uid + "/file?size=1921")
            //const image = await sharp(result.body)
            //const metadata = await image.metadata()
            //expect(metadata.width).toBe(100)
            //expect(metadata.height).toBe(100)
            expect(result.status).toBe(400)
        })
    })
})