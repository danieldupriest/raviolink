import { formatBytes } from "./tools.mjs"

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
