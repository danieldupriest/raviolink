import createApp from "./app.mjs"
import { log, debug } from "./utils/logger.mjs"

/**
 * Creates a new app and starts a server listening.
 * Control+C will close the server.
 */
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
