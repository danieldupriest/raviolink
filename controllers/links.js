const Link = require("../database/link.js");
const Timer = require("../database/timer.js");
const validUrl = require("../utils/urlChecker.js");

function generatePageData(link) {
    // Prepare text/code
    let split = link.content.split("\n");
    let output = [];
    split.forEach((row) => {
        output.push(row);
    });

    // Convert date
    link.createdOn = link.createdOn.toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const data = {
        url: link.type == "link",
        text: link.type == "text",
        code: link.type == "code",
        rows: output,
        link: link,
    };

    return data;
}

const handleLink = async (req, res) => {
    // Try to retrieve link
    const { hash } = req.params;
    const link = await Link.findByHash(hash);

    // Handle URL type
    if (link.type == "link") {
        console.log("Redirecting to: " + link.content);
        return res.redirect(301, link.content);
    }

    const data = generatePageData(link);

    console.log("Rendering link with data: " + JSON.stringify(data));
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
    const { content, type } = req.body;
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

    // Generate new link
    let newLink = new Link(content, type);
    await newLink.save();

    const data = generatePageData(newLink);

    console.log("Rendering link with data: " + JSON.stringify(data));
    return res.render("index", data);
};
module.exports = { handleLink, frontPage, postLink };
