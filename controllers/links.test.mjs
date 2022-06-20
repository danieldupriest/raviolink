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
        expect(response.text).toMatch(/google.com/)
    })
})

test("Render 404 error for non-existent page abc.html", async () => {
    await supertest(app)
        .get("/abc.html")
        .expect(404)
        .then((response) => {
            expect(response.text).toMatch(/Resource not found/)
        })
})
