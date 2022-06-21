import supertest from "supertest"
import createApp from "../app.mjs"
import Database from "../database/Database.mjs"
let db, server, agent

beforeAll((done) => {
    db = Database.instance("default", { temporary: true, memory: true })
    const app = createApp()
    server = app.listen(8000, (err) => {
        if (err) done(err)
        agent = supertest.agent(server)
        done()
    })
})

afterAll((done) => {
    server.close((err) => {
        if (err) console.error(err)
        db.close().then(done)
    })
})

describe("Testing normal pages", () => {
    test("Render index page /", async () => {
        const result = await agent.get("/").expect(200)
        expect(result.text.includes("URL")).toBe(true)
    })
    test("Render missing resource abc.html", async () => {
        const result = await agent.get("/abc.html").expect(404)
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
        const response = await agent.post("/").send(data).expect(201)
        expect(response.text).toMatch(/google.com/)
    })
})
