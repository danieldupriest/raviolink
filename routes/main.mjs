import rateLimiter from "../utils/rateLimiter.mjs"
import multer from "multer"
import express from "express"
import expressJoiValidation from "express-joi-validation"
import {
    uidSchema,
    sizeSchema,
    ipSchema,
    linkPostSchema,
} from "../utils/schemas.mjs"

// Configure a rate limiter for use in certain restricted routes
const limiter = rateLimiter({ window: 10 * 1000, limit: 2 })

// Configure upload middleware to save temporary uploaded files
const upload = multer({
    limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE) },
    dest: "./files",
}).single("content")

// configure request validator
const validator = expressJoiValidation.createValidator({})

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
    adminView,
} from "../controllers/links.mjs"

if (process.env.NODE_ENV == "test") {
    router.post("/delete", deleteLinks) // Admin route to delete links
    router.get("/adminview/:uid", adminView) // Route for testing
} else {
    router.post("/delete", limiter, deleteLinks) // Admin route to delete links
}
router.get("/ip/:ip", linkListByIp) // Show all links from specified IP
router.get("/links", linkList) // Shows overview list of all links
router.get("/:uid/file", handleFile) // Serves directly linked files
router.get("/:uid", handleLink) // Retrieves specified link
router.get("/", frontPage) // Shows default home page
if (process.env.NODE_ENV === "test") router.post("/", upload, postLink)
// Handle creation of link
else router.post("/", limiter, upload, postLink) // Handle creation of link

export default router
