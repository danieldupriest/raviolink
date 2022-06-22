import rateLimiter from "../utils/rateLimiter"
import multer from "multer"
import express from "express"

// Configure a rate limiter for use in certain restricted routes
const limiter = rateLimiter({ window: 10 * 1000, limit: 2 })

// Configure upload middleware to save temporary uploaded files
const upload = multer({
    limits: { fileSize: process.env.MAX_UPLOAD_SIZE },
    dest: "./files",
}).single("content")

// Main application routes
const router = express.Router()
import {
    handleLink,
    frontPage,
    postLink,
    handleFile,
    linkList,
    linkListByIp,
    deleteLinks,
} from "../controllers/links.mjs"

if (process.env.NODE_ENV != "test")
    router.post("/delete", limiter, deleteLinks) // Admin route to delete links
else router.post("/delete", deleteLinks) // Admin route to delete links
router.get("/ip/:ip", linkListByIp) // Show all links from specified IP
router.get("/links", linkList) // Shows overview list of all links
router.get("/:uid/file", handleFile) // Serves directly linked files
router.get("/:uid", handleLink) // Retrieves specified link
router.get("/", frontPage) // Shows default home page
if (process.env.NODE_ENV != "test")
    router.post("/", limiter, upload, postLink) // Handle creation of link
else router.post("/", upload, postLink) // Handle creation of link

export default router
