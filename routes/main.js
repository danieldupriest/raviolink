const { logStep } = require("./utils/middleware.js");

// Configure a rate limiter for use in certain routes
const rateLimiter = require("../utils/rateLimiter.js");
const limiter = rateLimiter({ window: 10 * 1000, limit: 2 });

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
    deleteLinks,
} = require("../controllers/links.js");

router.post("/delete", logStep("Before deleteLinks"), limiter, deleteLinks); // Admin route to delete links
router.get("/ip/:ip", logStep("Before linklistbyip"), linkListByIp); // Show all links from specified IP
router.get("/links", logStep("Before linklist"), linkList); // Shows overview list of all links
router.get("/:uid/file", logStep("Before handleFile"),handleFile); // Serves directly linked files
router.get("/:uid", logStep("Before handleLink"), handleLink); // Retrieves specified link
router.get("/", logStep("Before frontPage")frontPage); // Shows default home page
router.post("/", logStep("Before postLink"), limiter, upload, postLink); // Handle creation of link

module.exports = router;
