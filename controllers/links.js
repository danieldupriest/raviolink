import Link from "../database/link.js";
import Timer from "../database/timer.js";
import validUrl from "../utils/urlChecker.js";

export const handleLink = async (req, res) => {
    // Try to retrieve link
    const { hash } = req.params;
    const link = await Link.findByHash(hash);

    // Handle URL type
    if (link.type == "link") return res.redirect(301, link.content);

    // Prepare text
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
        link: link,
    };
    data.link.createdOn = new Date(link.createdOn).toISOString();
    res.render("index", data);
};

export const frontPage = (req, res) => {
    res.render("index", { link: null });
};

export const postLink = async (req, res) => {
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
    return res.render("index", { link: newLink });
};
