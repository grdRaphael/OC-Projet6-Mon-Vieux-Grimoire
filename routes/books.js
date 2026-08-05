import express from "express"
import { createBook, deleteBook, getAllBooks, getBestRating, getOneBook, modifyBook, rateBook } from "../controllers/book.js"
import auth from "../middleware/auth.js"


const router = express.Router()

router.get("/", getAllBooks)
router.get("/bestrating", getBestRating)
router.get("/:id", getOneBook)

router.post("/", auth, createBook)
router.put("/:id", auth, modifyBook)
router.delete("/:id", auth, deleteBook)
router.post("/:id/rating", auth, rateBook)


export default router