import express from "express"

import {
    createBook,
    deleteBook,
    getAllBooks,
    getBestRatingBooks,
    getOneBook,
    modifyBook,
    rateBook
} from "../controllers/book.js"

import auth from "../middleware/auth.js"
import multerConfig from "../middleware/multer-config.js"
import optimizeImage from "../middleware/sharp-config.js"


const router = express.Router()

router.get("/", getAllBooks)
router.get("/bestrating", getBestRatingBooks)
router.get("/:id", getOneBook)

router.post("/", auth, multerConfig, optimizeImage, createBook)
router.put("/:id", auth, multerConfig, optimizeImage, modifyBook)
router.delete("/:id", auth, deleteBook)
router.post("/:id/rating", auth, rateBook)


export default router