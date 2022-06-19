// Configure a rate limiter for use in certain routes
import rateLimiter from "../utils/rateLimiter.mjs"
const limiter = rateLimiter({ window: 10 * 1000, limit: 2 })

// Configure upload middleware
import multer from "multer"
const upload = multer({
    limits: { fileSize: process.env.MAX_UPLOAD_SIZE },
    dest: process.env.TEMP_FILE_PATH,
}).single("content")

// Routes
import express from "express"
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

router.post("/delete", limiter, deleteLinks) // Admin route to delete links
router.get("/ip/:ip", linkListByIp) // Show all links from specified IP
router.get("/links", linkList) // Shows overview list of all links
router.get("/:uid/file", handleFile) // Serves directly linked files
router.get("/:uid", handleLink) // Retrieves specified link
router.get("/", frontPage) // Shows default home page
router.post("/", limiter, upload, postLink) // Handle creation of link

export default router
