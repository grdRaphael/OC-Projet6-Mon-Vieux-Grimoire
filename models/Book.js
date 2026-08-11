import mongoose from "mongoose"

const bookSchema = new mongoose.Schema({
    userId: {type: String, required: true}, 
    title: {type: String, required: true},
    author: {type: String, required: true},
    imageUrl: {type: String, required: true},
    year: {type: Number, required: true},
    genre: {type: String, required: true},
    averageRating: {type: Number},
    ratings: [
        {
            userId: {type: String, required: true}, 
            grade: {
                type: Number, 
                required: true,
                min: [0, "La note doit être au minimum de 0"],
                max: [5, "La note doit être au maximum de 5"]
            },
        }
    ]
})

export default mongoose.model("Book", bookSchema)