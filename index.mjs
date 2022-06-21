import createApp from "./app.mjs"
import { log, debug } from "./utils/logger.mjs"
import { shutDown } from "./utils/tools.mjs"

async function init() {
    const app = createApp()
    const port = process.env.PORT || 8080
    const server = app.listen(port, () => {
        const message = `Raviolink listening on port ${port}`
        log(message)
        debug(message)
    })
    process.on("SIGTERM", shutDown("SIGTERM", server))
    process.on("SIGINT", shutDown("SIGTERM", server))
}

init()
