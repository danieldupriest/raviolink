require("dotenv").config();
const Link = require("../database/Link.js");
const validUrl = require("../utils/urlChecker.js");
const RavioliDate = require("../utils/dates.js");
const { serveError } = require("./errors.js");
const sanitize = require("sanitize-filename");
const path = require("path");
const { log, debug } = require("../utils/logger.js");
const fs = require("fs");

const MAX_DATE_MS = 8640000000000000;

function uidIsValid(uid) {
    const match = uid.match(/[A-Za-z0-9]{7}/);
    if (!match) debug(`Searched for UID ${uid} but did not find.`);
    return match;
}

function fileExists(link) {
    const fullPath = path.resolve(
        __dirname,
        "..",
        "files",
        link.uid,
        link.content
    );
    return fs.existsSync(fullPath);
}

const handleLink = async (req, res, next) => {
    const { uid } = req.params;
    const link = await Link.findByUid(uid);

    if (!link) return serveError(res, 404, "Link not found");

    await link.checkExpiration();
    await link.checkViewsLeft();

    const valid = uidIsValid(uid);
    const exists = link != "undefined";
    const deleted = link.isDeleted();
    const expired = link.isExpired();
    if (!uidIsValid(uid) || !link || link.isDeleted() || link.isExpired()) {
        return serveError(res, 404, "Link not found");
    }

    log("Loading link: " + JSON.stringify(link));

    //Handle redirects and raw links
    switch (link.type) {
        case "link":
            await link.decrementViewsLeft();
            return res.redirect(301, link.content);
            break;
        case "text":
            await link.decrementViewsLeft();
            if (link.raw) {
                res.setHeader("content-type", "text/plain");
                return res.send(link.content);
            }
            break;
        case "file":
            // Check that file exists
            if (!fileExists(link)) {
                return next(
                    new Error(
                        `File ${link.content} for UID ${link.uid} not found.`
                    )
                );
            }

            // Handle direct downloads
            if (link.raw) {
                await link.decrementViewsLeft();
                return res.sendFile(fullPath, {}, (err) => {
                    if (err) {
                        return next(err);
                    }
                });
            }
            break;
        default:
            return next(new Error("Unsupported link type."));
    }

    // Handle display of normal, non-raw links
    res.render("index", { link: link, ...res.locals.pageData });
};

const handleFile = async (req, res, next) => {
    const { uid } = req.params;
    const link = await Link.findByUid(uid);

    if (!link) return serveError(res, 404, "Link not found");

    await link.checkExpiration();
    await link.checkViewsLeft();
    if (
        !uidIsValid(uid) ||
        link.isDeleted() ||
        (await link.isExpired()) ||
        link.type != "file"
    ) {
        return serveError(res, 404, "Link not found");
    }

    if (!fileExists(link)) {
        return next(
            new Error(`File ${link.content} for UID ${link.uid} not found.`)
        );
    }
    const fullPath = path.resolve(
        __dirname,
        "..",
        "files",
        link.uid,
        link.content
    );
    debug(`Sending file: ${fullPath}`);
    await link.decrementViewsLeft();
    return res.sendFile(fullPath, {}, (err) => {
        if (err) {
            next(err);
        }
    });
};

const frontPage = (req, res) => {
    return res.render("index", { link: null, ...res.locals.pageData });
};

const postLink = async (req, res, next) => {
    // Filter input
    let { content, type, expires, deleteOnView, raw, textType } = req.body;
    if (typeof raw == "undefined") raw = false;
    if (typeof textType == "undefined") textType = "plain";

    // Calculate expiration date
    let expireDate = null;
    if (expires != "never") {
        const msToAdd = parseInt(expires);
        const now = RavioliDate();
        expireDate = RavioliDate(now.getTime() + msToAdd);
    }

    // Conditional code
    let newLink;
    if (type == "link") {
        if (!validUrl(content))
            return next(new Error("URL contains unsupported characters."));
        newLink = new Link(
            content,
            type,
            expireDate,
            deleteOnView == "true" ? true : false,
            raw == "true" ? true : false,
            textType
        );
    } else if (type == "text") {
        newLink = new Link(
            content,
            type,
            expireDate,
            deleteOnView == "true" ? true : false,
            raw == "true" ? true : false,
            textType
        );
    } else if (type == "file") {
        if (!req.file) return next(new Error("File not found"));
        const sanitizedFilename = sanitize(req.file.originalname);
        if (sanitizedFilename.length > 255)
            return next(new Error("Filename too long"));
        if (sanitizedFilename == "") return next(new Error("Invalid filename"));
        newLink = new Link(
            sanitizedFilename,
            type,
            expireDate,
            deleteOnView == "true" ? true : false,
            raw == "true" ? true : false,
            textType,
            req.file["path"],
            req.file["mimetype"]
        );
    } else {
        return next(Error("Unsupported type"));
    }
    await newLink.save();
    return res.render("index", {
        link: newLink,
        showLink: true,
        ...res.locals.pageData,
    });
};

const linkList = async (req, res, next) => {
    let links = await Link.findAll();
    for (const link of links) {
        await link.checkExpiration();
    }
    links = links.filter((link) => {
        return !link.isDeleted() && !link.isExpired() && !link.deleteOnView;
    });
    return res.render("links", { links: links, ...res.locals.pageData });
};

module.exports = { handleLink, frontPage, postLink, handleFile, linkList };
