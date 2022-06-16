// Configure a rate limiter for use in certain routes
const rateLimiter = require("../utils/rateLimiter.js");
const limiter = rateLimiter({ window: 10 * 1000, limit: 1 });

// Configure upload middleware
const multer = require("multer");
const upload = multer({
    limits: { fileSize: process.env.MAX_UPLOAD_SIZE },
    dest: process.env.TEMP_FILE_PATH,
}).single("content");

// Routes
const express = require("express");
const router = express.Router();
const {
    handleLink,
    frontPage,
    postLink,
    handleFile,
    linkList,
    linkListByIp,
} = require("../controllers/links.js");
router.get("/ip/:ip", linkListByIp); // Show all links from specified IP
router.get("/links", linkList); // Shows overview list of all links
router.get("/:uid/file", handleFile); // Serves directly linked files
router.get("/:uid", handleLink); // Retrieves specified link
router.get("/", frontPage); // Shows default home page
router.post("/", [limiter, upload, postLink]); // Handle creation of link

module.exports = router;
