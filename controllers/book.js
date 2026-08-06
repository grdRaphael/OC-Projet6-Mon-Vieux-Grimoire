import Book from "../models/Book.js";
import fs from "fs" // module natif de Node.js pour gérer des fichiers
import path from "node:path";

export const createBook = async (req, res, next) => {

    console.log('req.body :', req.body)
    console.log('req.file :', req.file)
    console.log('req.auth :', req.auth)
    console.log('host :', req.get('host'))
    console.log('req.body.book :', req.body.book)

    try {
        const bookObject = JSON.parse(req.body.book) // book est l'étiquette du formadata définit dans le front (common.js)
        delete bookObject.userId
        delete bookObject._id

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        })
        await book.save()
        res.status(201).json({ message: 'Livre enregistré !' })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
};

export const modifyBook = async (req, res, next) => {
    const bookObject = req.file ? {                      // est ce qu'une nouvelle image existe ? 
        ...JSON.parse(req.body.book),                    // si oui :  afficher objet avec req.body parser
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // et on recontruit la chemin de la nouvelle image
    } : { ...req.body }

    delete bookObject.userId

    try {
        const book = await Book.findOne({ _id: req.params.id })

        if (book === null) {
            return res.status(404).json({ message: "Livre non trouvé" })
        }

        if (book.userId !== req.auth.userId) {
            res.status(401).json({ message: 'Not authorized' })
        } else {
            try {
                await Book.updateOne(
                    { _id: req.params.id },
                    { ...bookObject, _id: req.params.id }
                )
                if (req.file) {
                    const filename = book.imageUrl.split("/images/")[1]
                    await fs.promises.unlink(path.join(import.meta.dirname, "..", "images", filename))
                }
                res.status(200).json({ message: 'Livre modifié' })
            } catch (error) {
                res.status(401).json({ error })
            }
        }
    } catch (error) {
        res.status(500).json({ error })
    }
};

export const rateBook = (req, res, next) => {

};

export const getAllBooks = async (req, res, next) => {
    try {
        const books = await Book.find()
        res.status(200).json(books)
    } catch (error) {
        res.status(400).json({ error })
    }
};

export const getOneBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id })
        if (book === null) {
            return res.status(404).json({ message: 'Livre non trouvé' })
        }
        res.status(200).json(book)
    } catch (error) {
        res.status(404).json({ error })
    }
};

export const getBestRatingBooks = async (req, res, next) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(3)
        // sort() et limit() sont des opérations de MongoDB
        res.status(200).json(books)
    }
    catch (error) {
        res.status(400).json({ error })
    }
};

export const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id })
        if (book === null) {
            return res.status(404).json({ message: "Livre non trouvé" })
        }
        if (book.userId != req.auth.userId) {
            res.status(401).json({ message: "Not authorized" })
        } else {
            const filename = book.imageUrl.split("/images/")[1]
            fs.unlink(path.join(import.meta.dirname, "..", "images", filename), async () => {
                try {
                    const book = await Book.deleteOne({ _id: req.params.id })
                    res.status(200).json({ message: "Livre supprimé" })
                } catch (error) {
                    res.status(401).json({ error })
                }
            })
        }
    } catch (error) {
        res.status(500).json({ error })
    }
}
