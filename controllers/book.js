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
        delete bookObject.ratings
        delete bookObject.averageRating

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        })
        await book.save()
        res.status(201).json({ message: 'book saved' })
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
            return res.status(404).json({ message: "book not found" })
        }

        if (book.userId !== req.auth.userId) {
            res.status(403).json({ message: 'unauthorized request' })
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
                res.status(200).json({ message: 'book modified' })
            } catch (error) {
                res.status(403).json({ message: "unauthorized request" })
            }
        }
    } catch (error) {
        res.status(500).json({ error })
    }
};

export const rateBook = async (req, res, next) => {

    try {
        // Le front limite déjà la note à 1-5, mais l'API est joignable
        // directement (Postman) : la validation doit être côté serveur.
        // Placé avant le findOne pour ne pas interroger la base pour rien.
        if (req.body.rating < 0 || req.body.rating > 5) {
            return res.status(400).json({ error: "La note doit être entre 0 et 5" })
        }

        const book = await Book.findOne({ _id: req.params.id })
        if (book === null) {
            return res.status(404).json({ message: 'Livre non trouvé' })
        }

        const isAlreadyRated =
            book.ratings.some(rating =>
                rating.userId === req.auth.userId)
        // some() vérifie si un élément du tableau satisfait une condition

        const ratedBook =
        {
            userId: req.auth.userId,
            grade: req.body.rating
        }

        if (!isAlreadyRated) {
            book.ratings.push(ratedBook)

            const totalRating = book.ratings.reduce((acc, grade) => {
                return acc + grade.grade
            }, 0)
            const averageRating = totalRating / book.ratings.length
            book.averageRating = averageRating
            await book.save()

            res.status(200).json(book)
        } else {
            res.status(404).json({ message: "book already rated" })
            console.log('livre déja noté')
        }
    } catch (error) {
        res.status(500).json({ error })
        console.error(error)
    }
}


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
            return res.status(404).json({ message: "book not find" })
        }
        if (book.userId != req.auth.userId) {
            res.status(403).json({ message: "unauthorized request" })
        } else {
            const filename = book.imageUrl.split("/images/")[1]
            fs.unlink(path.join(import.meta.dirname, "..", "images", filename), async () => {
                try {
                    const book = await Book.deleteOne({ _id: req.params.id })
                    res.status(200).json({ message: "book delete" })
                } catch (error) {
                    res.status(401).json({ error })
                }
            })
        }
    } catch (error) {
        res.status(500).json({ error })
    }
}
