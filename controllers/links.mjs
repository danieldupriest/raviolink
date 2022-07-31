import config from "dotenv"
config.config()
import Joi from "joi"
import Link from "../database/Link.mjs"
import Date from "../utils/date.mjs"
import sanitize from "sanitize-filename"
import path from "path"
import { log, debug } from "../utils/logger.mjs"
import fs from "fs"
import Clamscan from "clamscan"
import sharp from "sharp"
import Cache from "../utils/cache.mjs"
import { formatBytes, urlIsValid } from "../utils/tools.mjs"
import {
    ipSchema,
    uidSchema,
    sizeSchema,
    linkPostSchema,
    linkServeSchema,
} from "../utils/schemas.mjs"

const cache = new Cache()

/**
 * This helper function runs through the necessary checks when accessing a
 * link. If the link is not accessible for any reason it will return false.
 * @param {Link} link - link to check. It can be null.
 * @returns true if the link is valid and accessible.
 */
const checkLinkState = async (link) => {
    if (!link) return false
    await link.checkExpiration()
    await link.checkViewsLeft()
    const deleted = link.isDeleted()
    const expired = link.isExpired()
    if (link.isDeleted() || link.isExpired()) return false
    return true
}

/**
 * Load the requested link, carry out expiration and access
 * checks, and render it.
 */
export const handleLink = async (req, res, next) => {
    const {
        error,
        value: { uid },
    } = Joi.object({ uid: uidSchema }).validate(req.params)
    if (error) {
        res.statusCode = 400
        return next(new Error("Invalid link UID"))
    }

    const link = await Link.findByUid(uid)

    // Check that link is accessible
    if (!(await checkLinkState(link))) return next()

    debug("Loaded link: " + JSON.stringify(link))

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
            if (link.raw) return handleFile(req, res, next, link)
            break
    }

    // Handle display of normal, non-raw links
    const { error: linkError, value: linkJson } = linkServeSchema.validate(link)
    if (linkError) return next(linkError)

    res.render("index", {
        link: linkJson,
        formattedSize: formatBytes(link.size()),
        ...res.locals.pageData,
    })
}

/**
 * Loads a file type link and serves the file data directly to the client,
 * displaying with the appropriate content type. Images can be resized with
 * the ?size=100 query parameter, and resized images will be cached for later
 * accesses.
 * @param {Link} preCheckedLink - If a link is passed in with this parameter,
 * the controller will forgo the link checks and move straight on to serving.
 */
export const handleFile = async (req, res, next, preCheckedLink = null) => {
    // Get UID
    const {
        error: uidError,
        value: { uid },
    } = Joi.object({ uid: uidSchema }).validate(req.params)
    if (uidError) {
        res.statusCode = 400
        return next(new Error("Invalid link UID"))
    }

    // Get size
    const {
        error: sizeError,
        value: { size },
    } = Joi.object({ size: sizeSchema }).validate(req.query)
    if (sizeError) {
        res.statusCode = 400
        return next(sizeError)
    }

    // Either load the link from the database, or if it's being passed in
    // from another handler, skip the checks.
    if (preCheckedLink) {
        var link = preCheckedLink
    } else {
        var link = await Link.findByUid(uid)
        if (!(await checkLinkState(link))) next()
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
    const max = parseInt(process.env.MAXIMUM_IMAGE_RESIZE)
    if (size > max) {
        res.statusCode = 400
        return next(
            new Error(`Size parameter must be equal to or smaller than ${max}`)
        )
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
        buffer = await sharp(fullPath).resize(size, size).jpeg().toBuffer()
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
    // Validate post data
    let {
        error: postError,
        value: { content, type, expires, deleteOnView, raw, textType },
    } = linkPostSchema.validate(req.body)
    if (postError) {
        res.statusCode = 400
        return next(postError)
    }

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
            try {
                const scanner = new Clamscan()
                await scanner.init()
                const { _, isInfected, viruses } = await scanner.scanFile(
                    req.file.path
                )
                if (isInfected) {
                    fs.unlinkSync(req.file.path)
                    const message = `Virus detected in file: ${viruses.join(
                        ", "
                    )}`
                    log(message)
                    debug(message)
                    res.statusCode = 409
                    return next(new Error(message))
                }
            } catch (err) {
                try {
                    log("Error during virus scan. Deleting temp file.")
                    fs.unlinkSync(req.file.path)
                } catch (err) {
                    log("Error deleting temp file.")
                    return next(err)
                }
                return next(err)
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
    // Validate data
    const {
        error: error,
        value: { toDelete, password },
    } = Joi.object({
        toDelete: Joi.array().items(Joi.string()).required(),
        password: Joi.string().required(),
    }).validate(req.body)
    if (error) {
        res.statusCode = 400
        return next(error)
    }

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
    // Get IP
    const {
        error: ipError,
        value: { ip },
    } = Joi.object({ ip: ipSchema }).validate(req.params)
    if (ipError) {
        res.statusCode = 400
        return next(new Error("Invalid IP"))
    }

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
    // Get UID
    const {
        error: uidError,
        value: { uid },
    } = Joi.object({ uid: uidSchema }).validate(req.params)
    if (uidError) {
        res.statusCode = 400
        return next(new Error("Invalid link UID"))
    }

    const link = await Link.findByUid(uid)
    return res.json(link)
}
