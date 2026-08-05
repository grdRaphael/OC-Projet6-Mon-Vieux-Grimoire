import Book from "../models/Book.js";

export const createBook = (req, res, next) => {


    console.log('req.body :', req.body)
    console.log('req.file :', req.file)
    console.log('req.auth :', req.auth)
    console.log('host :', req.get('host'))
    console.log('req.body.book :', req.body.book)


    const bookObject = JSON.parse(req.body.book) // book est l'étiquette du formadata définit dans le front (common.js)
    delete bookObject.userId
    delete bookObject._id
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })
    book.save()
        .then(() => { res.status(201).json({ message: 'Livre enregistré !' }) })
        .catch(error => { res.status(400).json({ error: error.message }) })
};

export const modifyBook = (req, res, next) => {

};

export const rateBook = (req, res, next) => {

};

export const getAllBooks = (req, res, next) => {

};

export const getOneBook = (req, res, next) => {

};

export const getBestRating = (req, res, next) => {

};

export const deleteBook = (req, res, next) => {

};