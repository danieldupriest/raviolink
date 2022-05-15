require("dotenv").config();
const Link = require("../database/link.js");
const Timer = require("../database/timer.js");
const validUrl = require("../utils/urlChecker.js");
const RavioliDate = require("../utils/dates.js");

const MAX_DATE_MS = 8640000000000000;

console.log("Process.env.SERVER: " + process.env.SERVER);
const serverString =
    process.env.SERVER + (process.env.PORT == 80 ? "" : ":" + process.env.PORT);
console.log("ServerString: " + serverString);

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
        rows: output,
        link: link.toJSON(),
        server: serverString,
    };

    return data;
}

const handleLink = async (req, res) => {
    // Try to retrieve link
    const { uid } = req.params;
    const link = await Link.findByUid(uid);

    console.log("Link: " + link);
    // Handle missing links
    if (!link) {
        res.status(404);
        return res.render("error", {
            server: serverString,
            status: 404,
            error: "Link not found",
        });
    }

    // Handle expired links
    const now = new RavioliDate(RavioliDate.now());
    if (now > link.expiresOn) {
        await link.delete();
        return res.render("error", {
            server: serverString,
            status: 410,
            error: "Link has expired",
        });
    }

    // Handle URL type
    if (link.type == "link") {
        console.log("Redirecting to: " + link.content);
        return res.redirect(301, link.content);
    }

    // Handle Text/Code types
    const data = generatePageData(link);
    res.render("index", data);
};

const frontPage = (req, res) => {
    res.render("index", { link: null });
};

const postLink = async (req, res) => {
    /*// Check for an active timer and create new one if needed
    const ip = req.socket.remoteAddress;
    let userTimer;
    try {
        userTimer = await Timer.findByIp(ip);
        if (!userTimer.canPost()) {
            await userTimer.increaseDelay();
            await userTimer.update();
            throw new Error("Too soon to post again. Delay extended.");
        }
    } catch {
        userTimer = new Timer(ip);
    }

    // Increase post timer.
    await userTimer.decreaseDelay();
    await userTimer.update();*/

    // Filter input
    const { content, type, expires } = req.body;
    switch (type) {
        case "link":
            if (!validUrl(content))
                throw new Error("URL contains unsupported characters.");
            break;
        case "text":
            break;
        case "code":
            break;
        default:
            throw new Error(`Unsupported type: ${type}`);
    }

    // Calculate expiration date
    let expireDate = null;
    if (expires != "never") {
        const msToAdd = parseInt(expires);
        const now = new RavioliDate(RavioliDate.now());
        console.log("msToAdd: " + msToAdd + " Now: " + now);
        expireDate = new RavioliDate(now.getTime() + msToAdd);
    }
    console.log("generated expire date: " + expireDate);
    let newLink = new Link(content, type, expireDate);
    await newLink.save();

    const data = generatePageData(newLink);

    console.log("Rendering link with data: ");
    return res.render("index", data);
};
module.exports = { handleLink, frontPage, postLink };
