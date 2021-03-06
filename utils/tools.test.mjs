import { integer } from "sharp/lib/is"
import { formatBytes, genUid, uidIsValid, urlIsValid, fileExistsRecursive, sleep } from "./tools.mjs"
import fs from "fs"
import { log } from "./logger.mjs"

describe("formatBytes", () => {
    test("bytes", () => {
        expect(formatBytes(100)).toBe("100 Bytes")
    })

    test("kilobytes", () => {
        expect(formatBytes(100000)).toBe("97.66 KB")
    })

    test("megabytes", () => {
        expect(formatBytes(100000000)).toBe("95.37 MB")
    })

    test("gigabytes", () => {
        expect(formatBytes(100000000000)).toBe("93.13 GB")
    })
})

describe("genUid", () => {
    describe("given a request to generate a 7-character uid", () => {
        it("should return a 7-character UID", () => {
            const result = genUid(7)
            expect(result.length).toBe(7)
        })
        it("should return a UID with only upper and lowercase alphanumerics", () => {
            const result = genUid(7)
            expect(result).toMatch(/[A-Za-z0-9]{7}/)
        })
    })
})

describe("uidIsValid", () => {
    describe("given a 7 character alphanumeric UID", () => {
        it("should return true", () => {
            const input = "AaBbCc1"
            const result = uidIsValid(input)
            expect(result).toBe(true)
        })
    })
    describe("given a 6 character alphanumeric UID", () => {
        it("should return false", () => {
            const input = "AaBbCc"
            const result = uidIsValid(input)
            expect(result).toBe(false)
        })
    })
    describe("given a 8 character alphanumeric UID", () => {
        it("should return false", () => {
            const input = "AaBbCc12"
            const result = uidIsValid(input)
            expect(result).toBe(false)
        })
    })
    describe("given a 7 character string with punctuation", () => {
        it("should return false", () => {
            const input = "AaBbCc."
            const result = uidIsValid(input)
            expect(result).toBe(false)
        })
    })
})

describe("urlIsValid", () => {
    test("URL beginning with http is accepted", () => {
        expect(urlIsValid("http://google.com")).toBe(true)
    })

    test("URL beginning with https is accepted", () => {
        expect(urlIsValid("https://google.com")).toBe(true)
    })

    test("URL with port is accepted", () => {
        expect(urlIsValid("http://google.com:12345")).toBe(true)
    })

    test("URL with missing protocol should be rejected", () => {
        expect(urlIsValid("google.com")).toBe(false)
    })

    const urlChars = [
        ["-", true],
        [".", true],
        ["_", true],
        ["$", true],
        ["?", true],
        ["&", true],
        ["+", true],
        [",", true],
        [";", true],
        ["%", true],
        ["=", true],
        ["#", true],
        [":", true],
        ["~", true],
        ["!", false],
        ["'", false],
        ["(", false],
        [")", false],
        ["*", false],
        [`"`, false],
        ["[", false],
        ["]", false],
        ["@", false],
    ]

    describe("character support in URLs", () => {
        test.each(urlChars)("char %s support is %s", (char, result) => {
            expect(
                urlIsValid(
                    `http://ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.com:0123456789/${char}`
                )
            ).toBe(result)
        })
    })
})

describe("fileExistsRecursive", () => {
    const tempDir = "./temporary"
    beforeEach(() => {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
    })
    afterEach(() => {
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true })
    })
    describe("given the search file existing within the root directory", () => {
        it("should return true", () => {
            const tempFile = fs.writeFileSync(
                tempDir + "/tempFile.txt",
                "Temporary content"
            )
            const result = fileExistsRecursive("tempFile.txt", tempDir)
            expect(result).toBe(true)
        })
    })
    describe("given the searched file not existing within the root directory", () => {
        it("should return false", () => {
            const result = fileExistsRecursive("doesntExist.txt", tempDir)
            expect(result).toBe(false)
        })
    })
    describe("given the search file existing within a nested directory", () => {
        it("should return true", () => {
            fs.mkdirSync(tempDir + "/subdir")
            fs.writeFileSync(
                tempDir + "/subdir/tempFile.txt",
                "Temporary content"
            )
            const result = fileExistsRecursive("tempFile.txt", tempDir)
            expect(result).toBe(true)
        })
    })
    describe("given the search file not existing within any nested directories", () => {
        it("should return false", () => {
            fs.mkdirSync(tempDir + "/subdir")
            fs.mkdirSync(tempDir + "/subdir/subdir")
            fs.writeFileSync(
                tempDir + "/subdir/subdir/wrongFile.txt",
                "Temporary content"
            )
            const result = fileExistsRecursive("tempFile.txt", tempDir)
            expect(result).toBe(false)
        })
    })
})

describe("sleep", () => {
    const tempDir = "./temporary"
    describe("given a sleep with delay set to 100ms", () => {
        it("should have at least 95ms elapsed before completing", async() => {
            function hrTimeToMicroseconds(hrTimeArray) {
                return hrTimeArray[0] * 1000000 + hrTimeArray[1] / 1000
            }
            const start = process.hrtime()  
            await sleep(100)
            const elapsed = process.hrtime(start)
            const elapsedMicroseconds = hrTimeToMicroseconds(elapsed)
            log("elapsedMicroseconds: " + elapsedMicroseconds)
            expect(elapsedMicroseconds).toBeGreaterThan(95000)
        })
    })
})