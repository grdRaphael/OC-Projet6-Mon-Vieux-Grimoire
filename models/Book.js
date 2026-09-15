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
                min: [0, "rating must be at least 0"],
                max: [5, "rating must be at most 5"]
            },
        }
    ]
})

export default mongoose.model("Book", bookSchema)