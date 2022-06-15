// Configure a rate limiter for use in certain routes
const rateLimiter = require("../utils/rateLimiter.js");
const limiter = rateLimiter({ window: 10 * 1000, limit: 1 });
const { cache } = require("../utils/middleware.js");

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
} = require("../controllers/links.js");
router.get(process.env.BASE_URL + "/links", linkList); // Shows overview list of all links
router.get(process.env.BASE_URL + "/:uid/file", cache(3600), handleFile); // Serves directly linked files
router.get(process.env.BASE_URL + "/:uid", handleLink); // Retrieves specified link
router.get(process.env.BASE_URL + "/", frontPage); // Shows default home page
router.post(process.env.BASE_URL + "/", [limiter, upload, postLink]); // Handle creation of link

module.exports = router;
