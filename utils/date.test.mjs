import createDate from "./date.mjs"

describe("createDate", () => {
    describe("given a date object with ms = 1234567890000", () => {
        describe("toFullDate", () => {
            it("should return 'Friday, February 13, 2009 at 3:31 pm'", () => {
                const date = createDate(1234567890000)
                const fullDate = date.toFullDate()
                expect(fullDate).toBe("Friday, February 13, 2009 at 3:31 pm")
            })
        })
        describe("toShortDate", () => {
            it("should return 'Feb. 13, 2009'", () => {
                const date = createDate(1234567890000)
                const shortDate = date.toShortDate()
                expect(shortDate).toBe("Feb. 13, 2009")
            })
        })
        describe("toISODate", () => {
            it("should return '2009-02-13 15:31:30'", () => {
                const date = createDate(1234567890000)
                const isoDate = date.toISODate()
                expect(isoDate).toBe("2009-02-13 15:31:30")
            })
        })
        describe("toJSON", () => {
            it("should return 'Friday, February 13, 2009 at 3:31 pm'", () => {
                const date = createDate(1234567890000)
                const jsonDate = date.toJSON()
                expect(jsonDate).toBe("Friday, February 13, 2009 at 3:31 pm")
            })
        })
        describe("toString", () => {
            it("should return 'Friday, February 13, 2009 at 3:31 pm'", () => {
                const date = createDate(1234567890000)
                const stringDate = date.toString()
                expect(stringDate).toBe("Friday, February 13, 2009 at 3:31 pm")
            })
        })
    })
})