import { formatBytes, urlIsValid } from "./tools.mjs"

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

describe("validUrl", () => {
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
