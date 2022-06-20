import supertest from "supertest"
import createApp from "../index.mjs"
import Database from "../database/Database.mjs"
import init from "../database/initialize.mjs"
const app = createApp()
let db

beforeAll(async () => {
    db = new Database()
    await init(db)
})

afterAll(async () => {
    db.close()
})

describe("Testing normal pages", () => {
    test("Render index page /", async () => {
        const result = await supertest(app).get("/").expect(200)
        expect(result.text.includes("URL")).toBe(true)
    })
    test("Render missing resource abc.html", async () => {
        const result = await supertest(app).get("/abc.html").expect(404)
        expect(result.text.includes("Resource not found")).toBe(true)
    })
})

describe("Testing link posting", () => {
    test("Submit URL link", async () => {
        const data = {
            content: "http://google.com",
            type: "link",
            expires: "never",
        }
        const response = await supertest(app).post("/").send(data).expect(201)
        expect(response.text.includes("google.com")).toBe(true)
    })
})

/*test("Render non-existent page abc.html", async () => {
    await supertest(app)
        .get("/abc.html")
        .expect(404)
        .then((res) => {
            expect(res.body.contains("Resource not found")).toBe(true)
        })
})
*/
