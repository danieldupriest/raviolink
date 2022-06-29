import fs from "fs"
import Link from "./Link.mjs"

beforeAll(async() => {
    await Link.init()
})

afterEach(async () => {
    await Link.hardDeleteAll()
})

describe("isImage", () => {
    const imageTypesToTest = [
        { filename: "test.jpg", mimetype: "image/jpeg"},
        { filename: "test.png", mimetype: "image/png"},
        { filename: "test.gif", mimetype: "image/gif"},
        { filename: "test.svg", mimetype: "image/svg+xml"},
        { filename: "test.webp", mimetype: "image/webp"},   
    ]
    for (const {filename, mimetype} of imageTypesToTest) {
        describe(`given a file link with mimetype of ${mimetype}`, () => {
            it("should return true", async () => {
                fs.copyFileSync("./testData/" + filename, "./files/" + filename)
                const link = new Link(
                    filename,
                    "file",
                    null,
                    false,
                    false,
                    "plain",
                    '127.0.0.1',
                    "./files/" + filename,
                    mimetype,
                )
                await link.save()
                expect(link.isImage()).toBe(true)
            })
        })    
    }
    describe(`given a file link with a mimetype of text/plain`, () => {
        it("should return false", async () => {
            fs.copyFileSync("./testData/test.txt", "./files/test.txt")
            const link = new Link(
                "test.txt",
                "file",
                null,
                false,
                false,
                "plain",
                '127.0.0.1',
                "./files/test.txt",
                "text/plain",
            )
            await link.save()
            expect(link.isImage()).toBe(false)
        })
    })
})

describe("size", () => {
    describe("given a file type link with a size of 12 bytes", () => {
        it("should return 12", async () => {
            fs.copyFileSync("./testData/test.txt", "./files/test.txt")
            const link = new Link(
                "test.txt",
                "file",
                null,
                false,
                false,
                "plain",
                '127.0.0.1',
                "./files/test.txt",
                "text/plain",
            )
            await link.save()
            expect(link.size()).toBe(12)
        })
    })
    describe("given a text type link with 100 characters of content", () => {
        it("should return 100", async () => {
            const link = new Link(
                "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij",
                "text",
                null,
                false,
                false,
                "plain",
                '127.0.0.1',
            )
            await link.save()
            expect(link.size()).toBe(100)
        })
    })
    describe("given a URL type link with a 14 character-long URL", () => {
        it("should return 14", async () => {
            const link = new Link(
                "http://abc.com",
                "link",
                null,
                false,
                false,
                "plain",
                '127.0.0.1',
            )
            await link.save()
            expect(link.size()).toBe(14)
        })
    })
})

/*
constructor(
    content,
    type,
    expiresOn,
    deleteOnView,
    raw,
    textType,
    ip,
    tempFilename = "",
    mimeType = "",
    id = 0,
    createdOn = null,
    uid = "",
    deleted = false,
    viewsLeft = null,
    views = 0
*/