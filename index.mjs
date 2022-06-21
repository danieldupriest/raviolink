import createApp from "./app.mjs"
import { log, debug } from "./utils/logger.mjs"

async function init() {
    const app = createApp()
    const port = process.env.PORT || 8080
    const server = app.listen(port, () => {
        const message = `Raviolink listening on port ${port}`
        log(message)
        debug(message)
    })
    process.on("SIGTERM", () => {
        server.close()
    })
    process.on("SIGINT", () => {
        server.close()
    })
}

init()
