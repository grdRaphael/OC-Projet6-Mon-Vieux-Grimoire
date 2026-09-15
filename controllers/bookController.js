import Book from "../models/Book.js";
import fs from "fs" // module natif de Node.js pour gérer des fichiers
import path from "node:path";


const getImagePath = (imageUrl) =>
    path.join(import.meta.dirname, "..", "images", imageUrl.split("/images/")[1])

export const createBook = async (req, res) => {
    const bookObject = JSON.parse(req.body.book)
    // "book" est l'étiquette du FormData définie dans le front (common.js)

    const grade = bookObject.ratings?.[0]?.grade
    // Le front envoie un tableau de votes et une moyenne déjà calculés.
    // On ne garde qu'une chose : le chiffre du premier vote.

    // Rien ne vient du client.
    delete bookObject.userId
    delete bookObject._id
    delete bookObject.ratings
    delete bookObject.averageRating

    if (!req.file) {
        return res.status(400).json({ message: "image not found" })
    }


    const hasValidGrade = [1, 2, 3, 4, 5].includes(grade)
    // Le front envoie 0 quand aucune étoile
    // n'est cochée : ici, 0 veut dire « pas de vote »
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        // Le vote et la moyenne sont reconstruits ici, au nom du porteur du token.
        ratings: hasValidGrade ? [{ userId: req.auth.userId, grade }] : [],
        averageRating: hasValidGrade ? grade : 0
    })

    await book.save()
    res.status(201).json({ message: 'book saved' })
};

export const modifyBook = async (req, res) => {
    const bookObject = req.file ? {                      // est-ce qu'une nouvelle image existe ?
        ...JSON.parse(req.body.book),                    // si oui : on parse le corps
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }

    delete bookObject.userId                             // le corps ne décide pas du propriétaire

    const book = await Book.findOne({ _id: req.params.id })
    if (book === null) {
        return res.status(404).json({ message: "book not found" })
    }
    if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'unauthorized request' })
    }

    await Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }            // l'URL décide de la cible
    )

    // Le document d'abord, le fichier ensuite. Si la suppression de l'ancienne image
    // échoue, le livre est déjà à jour : on répond 200 et on garde la trace de
    // l'orphelin côté serveur, plutôt que de faire pointer le livre vers un fichier effacé.
    if (req.file) {
        await fs.promises.unlink(getImagePath(book.imageUrl))
            .catch(error => console.error("Old image not deleted:", error))
    }

    res.status(200).json({ message: 'book modified' })
};

export const rateBook = async (req, res) => {
    if (req.body.rating < 0 || req.body.rating > 5) {
        return res.status(400).json({ error: "rating must be between 0 and 5" })
    }

    const book = await Book.findOne({ _id: req.params.id })
    if (book === null) {
        return res.status(404).json({ message: 'book not found' })
    }

    // some() vérifie si un élément du tableau satisfait une condition
    const isAlreadyRated = book.ratings.some(rating => rating.userId === req.auth.userId)
    if (isAlreadyRated) {
        return res.status(400).json({ message: "book already rated" })
    }

    book.ratings.push({
        userId: req.auth.userId,      // jamais celui du corps de la requête
        grade: req.body.rating
    })

    const totalRating = book.ratings.reduce((acc, rating) => acc + rating.grade, 0)
    book.averageRating = Math.round((totalRating / book.ratings.length) * 10) / 10

    await book.save()
    res.status(200).json(book)
};

export const getAllBooks = async (req, res) => {
    const books = await Book.find()
    res.status(200).json(books)
};

export const getOneBook = async (req, res) => {
    const book = await Book.findOne({ _id: req.params.id })
    if (book === null) {
        return res.status(404).json({ message: 'book not found' })
    }
    res.status(200).json(book)
};

export const getBestRatingBooks = async (req, res) => {
    // sort() et limit() sont exécutés par MongoDB, pas en JavaScript
    const books = await Book.find().sort({ averageRating: -1 }).limit(3)
    res.status(200).json(books)
};

export const deleteBook = async (req, res) => {
    const book = await Book.findOne({ _id: req.params.id })
    if (book === null) {
        return res.status(404).json({ message: "book not found" })
    }
    if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "unauthorized request" })
    }

    // Le fichier d'abord, le document ensuite : si la seconde opération échoue,
    // il reste un livre sans image — visible et corrigeable — plutôt qu'un fichier
    // que plus rien ne référence, donc que personne ne saurait devoir nettoyer.
    await fs.promises.unlink(getImagePath(book.imageUrl))
        .catch(error => {
            if (error.code !== "ENOENT") throw error   // déjà absent : on poursuit
            console.error("Image already missing from disk:", book.imageUrl)
        })

    await Book.deleteOne({ _id: req.params.id })
    res.status(200).json({ message: "book deleted" })
}
