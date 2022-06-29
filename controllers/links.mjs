import config from "dotenv"
config.config()
import Link from "../database/Link.mjs"
import Date from "../utils/date.mjs"
import sanitize from "sanitize-filename"
import path from "path"
import { log, debug } from "../utils/logger.mjs"
import fs from "fs"
import Clamscan from "clamscan"
import sharp from "sharp"
import Cache from "../utils/cache.mjs"
import { formatBytes, urlIsValid, uidIsValid } from "../utils/tools.mjs"

const cache = new Cache()
const MAXIMUM_IMAGE_RESIZE = 1920

/**
 * Load the requested link, carry out expiration and access
 * checks, and render it.
 */
export const handleLink = async (req, res, next) => {
    const { uid } = req.params
    const link = await Link.findByUid(uid)

    if (!link) {
        return next()
    }
    await link.checkExpiration()
    await link.checkViewsLeft()

    const valid = uidIsValid(uid)
    //const exists = link != "undefined"
    const deleted = link.isDeleted()
    const expired = link.isExpired()
    if (!uidIsValid(uid) || !link || link.isDeleted() || link.isExpired()) {
        return next()
    }

    log("Loading link: " + JSON.stringify(link))

    //Handle redirects and raw links
    switch (link.type) {
        case "link":
            await link.access()
            return res.redirect(301, link.content)
            break
        case "text":
            await link.access()
            if (link.raw) {
                res.setHeader("content-type", "text/plain")
                return res.send(link.content)
            }
            break
        case "file":

            // Handle direct downloads
            if (link.raw) {
                const fullPath = path.resolve(
                    process.cwd(),
                    "files",
                    link.uid,
                    link.content
                )
                await link.access()
                return res.sendFile(fullPath, {}, (err) => {
                    if (err) {
                        return next(err)
                    }
                })
            }
            break
        default:
            res.statusCode = 400
            return next(new Error("Unsupported link type."))
    }

    // Handle display of normal, non-raw links
    res.render("index", {
        link: link,
        formattedSize: formatBytes(link.size()),
        ...res.locals.pageData,
    })
}

/**
 * Loads a file type link and serves the file data directly to the client,
 * displaying with the appropriate content type. Images can be resized with
 * the ?size=100 query parameter, and resized images will be cached for later
 * accesses.
 */
export const handleFile = async (req, res, next) => {
    const { uid } = req.params
    let { size } = req.query
    size = size ? parseInt(size) : null

    const link = await Link.findByUid(uid)

    if (!link) {
        res.statusCode = 404
        return next(
            new Error("Resource not found", {
                cause: `Link with UID ${uid} not found.`,
            })
        )
    }
    await link.checkExpiration()
    await link.checkViewsLeft()
    if (
        !uidIsValid(uid) ||
        link.isDeleted() ||
        (await link.isExpired()) ||
        link.type != "file"
    ) {
        return next()
    }

    // Generate file path
    const fullPath = path.resolve(
        process.cwd(),
        "files",
        link.uid,
        link.content
    )

    // Count this access against view limits
    await link.access()

    // Serve full file if no resize is requested
    if (!size) {
        return res.sendFile(fullPath, {}, (err) => {
            if (err) return next(err)
        })
    }

    // Serve error if requested size exceeds limits
    if (size > MAXIMUM_IMAGE_RESIZE) {
        res.statusCode = 400
        return next(new Error("Size parameter must be equal to or smaller than 1920"))
    }

    // Resize requested: make sure link is an image
    if (!link.isImage()) {
        res.statusCode = 400
        return next(new Error("File cannot be resized"))
    }

    // Setup caching, and load buffer from cache if available
    const key = req.get("X-Forwarded-Protocol") || req.originalUrl
    let buffer = cache.read(key)
    if (!buffer) {
        // Generate resized data if not yet cached
        buffer = await sharp(fullPath)
            .resize(size, size)
            .jpeg()
            .toBuffer()
        // Cache it
        cache.write(key, buffer)
    }

    // Serve data
    res.contentType(link.mimeType)
    res.write(buffer)
    return res.end()
}

/**
 * Render the main page of the app with forms for submitting links.
 */
export const frontPage = (req, res) => {
    return res.render("index", { link: null, ...res.locals.pageData })
}

/**
 * Handle creation of new links, saving them to the database, then rendering
 * a detail page for that link. This render does not count toward links with
 * delete-on-view enabled.
 */
export const postLink = async (req, res, next) => {
    let { content, type, expires, deleteOnView, raw, textType } = req.body

    // Catch any missing parameters
    if (
        (content == undefined && type != "file") ||
        type == undefined ||
        expires == undefined
    ) {
        res.statusCode = 400
        return next(new Error("Request is missing parameters"))
    }

    // Convert parameters
    deleteOnView = deleteOnView == "true" ? true : false
    raw = raw == "true" ? true : false
    textType = textType == undefined ? "plain" : textType

    // Calculate expiration date
    let expireDate = null
    if (expires != "never") {
        const msToAdd = parseInt(expires)
        const now = Date()
        expireDate = Date(now.getTime() + msToAdd)
    }

    // Get submitter IP address
    let ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0")
        .split(":")
        .pop()

    // Conditional code for each type
    switch (type) {
        case "link":
            // Check for bad URL formatting/characters
            if (!urlIsValid(content)) {
                res.statusCode = 400
                return next(
                    new Error(
                        "URL is invalid. It may contain unsupported characters."
                    )
                )
            }
            break
        case "text":
            log("text content.length: " + content.length)
            if (content.length > 500000) {
                res.statusCode = 413
                return next(new Error("Text content is too large."))
            }
            break
        case "file":
            log("file type")
            // Check that file is present in data
            if (!req.file) {
                res.statusCode = 400
                return next(new Error("Form data must contain a file."))
            }

            // Check for bad filename
            content = sanitize(req.file.originalname)
            log("Sanitized content: " + content)
            if (content.length > 255) {
                res.statusCode = 400
                return next(
                    new Error(
                        "Filename too long. Maximum length of 255 characters."
                    )
                )
            }
            if (content == "") {
                res.statusCode = 400
                return next(new Error("Filename contains invalid characters"))
            }

            // Perform virus scan when not testing
            if (process.env.NODE_ENV == "test") break
            const scanner = new Clamscan()
            await scanner.init()
            const { _, isInfected, viruses } = await scanner.scanFile(
                req.file.path
            )
            if (isInfected) {
                fs.unlinkSync(req.file.path)
                const message = `Virus detected in file: ${viruses.join(", ")}`
                log(message)
                debug(message)
                res.statusCode = 409
                return next(new Error(message))
            }
            break
        default:
            res.statusCode = 400
            return next(Error("Unsupported link type"))
    }
    const newLink = new Link(
        content,
        type,
        expireDate,
        deleteOnView,
        raw,
        textType,
        ip,
        req?.file?.path,
        req?.file?.mimetype
    )
    const saved = await newLink.save()
    res.status(201)
    return res.render("index", {
        link: newLink,
        formattedSize: formatBytes(newLink.size()),
        showLink: true,
        ...res.locals.pageData,
    })
}

/**
 * Load all links that have not been deleted, are expired, or have
 * delete-on-view enabled, then displays them in a list to the client.
 * The page allows an administrator to delete selected links.
 * */
export const linkList = async (req, res, next) => {
    let links = await Link.findAll()

    // Filter expired and delete-on-view links
    for (const link of links) {
        await link.checkExpiration()
    }
    links = links.filter((link) => {
        return !link.isDeleted() && !link.isExpired() && !link.deleteOnView
    })

    // Calculate some statistics
    let totalSize = 0
    for (const link of links) {
        totalSize += link.size()
    }

    return res.render("links", {
        links: links,
        results: links.length > 0,
        fullWidth: true,
        showLinks: true,
        totalSizeOnDisk: formatBytes(totalSize),
        ...res.locals.pageData,
    })
}

/**
 * Handles deletion of the specified links. This endpoint does not have
 * a confirmation step.
 */
export const deleteLinks = async (req, res, next) => {
    const { toDelete, password } = req.body
    let deleted = false
    if (password != process.env.ADMIN_PASSWORD) {
        res.statusCode = 401
        return next(
            new Error(`Unauthorized`, {
                cause: `${password} is not the correct password.`,
            })
        )
    }
    for (const uid of toDelete) {
        const link = await Link.findByUid(uid)
        if (!link) {
            res.statusCode = 400
            return next(new Error(`Resource not found`))
        }
        await link.delete()
        deleted = true
    }
    if (deleted) {
        res.status(202)
        return res.send("success")
    }
    res.statusCode = 404
    return next(new Error(`No links to delete`))
}

/**
 * Load all links from the specified IP that have not been deleted,
 * are expired, or have delete-on-view enabled, then displays them in a list
 * to the client. The page allows an administrator to delete selected links.
 */
export const linkListByIp = async (req, res, next) => {
    const { ip } = req.params
    let links = await Link.findAllByIp(ip)

    // Filter expired and delete-on-view links
    for (const link of links) {
        await link.checkExpiration()
    }
    links = links.filter((link) => {
        return !link.isDeleted() && !link.isExpired() && !link.deleteOnView
    })

    // Calculate some statistics
    let totalSize = 0
    for (const link of links) {
        totalSize += link.size()
    }

    return res.render("links", {
        links: links,
        results: links.length > 0,
        fullWidth: true,
        ip: ip,
        showLinks: true,
        totalSizeOnDisk: formatBytes(totalSize),
        ...res.locals.pageData,
    })
}

/**
 * Route for use in testing successful posting of data. It returns the full json
 * data of the link regardless of expiration or deletion state.
 */
export const adminView = async (req, res, next) => {
    const { uid } = req.params
    const link = await Link.findByUid(uid)
    return res.json(link)
}