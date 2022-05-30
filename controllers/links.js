require("dotenv").config();
const Link = require("../database/Link.js");
const validUrl = require("../utils/urlChecker.js");
const RavioliDate = require("../utils/dates.js");
const { serveError } = require("./errors.js");
const { generateServerString } = require("../utils/tools.js");
const sanitize = require("sanitize-filename");

const MAX_DATE_MS = 8640000000000000;

function uidIsValid(uid) {
    const match = uid.match(/[A-Za-z0-9]{7}/);
    if (!match) console.log("Invalid UID: " + uid);
    return match;
}

function generatePageData(link) {
    // Prepare text/code
    let split = link.content.split("\n");
    let output = [];
    split.forEach((row) => {
        output.push(row);
    });

    const data = {
        url: link.type == "link",
        text: link.type == "text",
        code: link.type == "code",
        file: link.type == "file",
        rows: output,
        link: link.toJSON(),
        server: generateServerString(),
        isImage: link.isImage(),
    };
    //data.link.createdOn = link.createdOn.toShortDate;
    //data.link.expiresOn = link.expiresOn ? link.expiresOn.toShortDate : "never";

    return data;
}

const handleLink = async (req, res, next) => {
    const { uid } = req.params;
    const link = await Link.findByUid(uid);

    if (!uidIsValid(uid) || !link || link.isDeleted() || link.isExpired()) {
        return serveError(res, 404, "Link not found");
    }

    console.log("Handling link: " + JSON.stringify(link));

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
            if (link.raw) {
                await link.decrementViewsLeft();
                return res.download(
                    "./files/" + link.uid + "/" + link.content,
                    (err) => {
                        if (err) throw err;
                    }
                );
            }
            break;
        default:
            throw new Error("Unsupported link type.");
    }

    // Handle display of normal, non-raw links
    const data = generatePageData(link);
    data.showLink = false;
    return res.render("index", data);
};

const handleFile = async (req, res, next) => {
    const { uid } = req.params;
    const link = await Link.findByUid(uid);
    if (
        !uidIsValid(uid) ||
        !link ||
        link.isDeleted() ||
        link.isExpired() ||
        link.type != "file"
    ) {
        return serveError(res, 404, "Link not found");
    }
    await link.decrementViewsLeft();
    return res.download("./files/" + link.uid + "/" + link.content);
};

const frontPage = (req, res) => {
    return res.render("index", { link: null, server: generateServerString() });
};

const postLink = async (req, res) => {
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
            throw new Error("URL contains unsupported characters.");
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
        if (!req.file) throw new Error("File not found");
        const sanitizedFilename = sanitize(req.file.originalname);
        if (sanitizedFilename.length > 255)
            throw new Error("Filename too long");
        if (sanitizedFilename == "") throw new Error("Invalid filename");
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
        throw new Error("Unsupported type");
    }
    await newLink.save();
    const data = generatePageData(newLink);
    data.showLink = true;
    return res.render("index", data);
};

const linkList = async (req, res, next) => {
    let links = await Link.findAll();
    links = links.filter((link) => {
        return !link.isDeleted() && !link.isExpired() && !link.expiresOn;
    });

    let data = {
        server: generateServerString(),
        showLink: true,
        links: [],
    };

    for (const link of links) {
        data.links.push(link.toJSON());
    }

    console.log(`Showing ${data.links.length} links`);

    return res.render("links", data);
};

module.exports = { handleLink, frontPage, postLink, handleFile, linkList };
