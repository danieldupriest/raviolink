import { formatBytes, urlIsValid } from "./tools.mjs"

describe("Testing formatBytes", () => {
    test("Test bytes", () => {
        expect(formatBytes(100)).toBe("100 Bytes")
    })

    test("Test Kilobytes", () => {
        expect(formatBytes(100000)).toBe("97.66 KB")
    })

    test("Test Megabytes", () => {
        expect(formatBytes(100000000)).toBe("95.37 MB")
    })

    test("Test Gigabytes", () => {
        expect(formatBytes(100000000000)).toBe("93.13 GB")
    })
})

describe("Testing validUrl", () => {
    test("URL beginning with http", () => {
        expect(urlIsValid("http://google.com")).toBe(true)
    })

    test("URL beginning with https", () => {
        expect(urlIsValid("https://google.com")).toBe(true)
    })

    test("URL with port", () => {
        expect(urlIsValid("http://google.com:12345")).toBe(true)
    })

    test("Missing protocol", () => {
        expect(urlIsValid("google.com")).toBe(false)
    })

    const urlChars = [
        ["-", true],
        [".", true],
        ["_", true],
        ["!", false],
        ["$", true],
        ["?", true],
        ["&", true],
        ["'", false],
        ["(", false],
        [")", false],
        ["*", false],
        ["+", true],
        [",", true],
        [";", true],
        ["%", true],
        ["=", true],
        ["#", true],
        [`"`, false],
        [":", true],
        ["[", false],
        ["]", false],
        ["~", true],
        ["@", false],
    ]

    describe("Testing character support in URLs", () => {
        test.each(urlChars)("Char %s support is %s", (char, result) => {
            expect(
                urlIsValid(
                    `http://ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.com:0123456789/${char}`
                )
            ).toBe(result)
        })
    })
})
