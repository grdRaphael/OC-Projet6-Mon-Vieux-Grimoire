import sharp from "sharp"
import path from "node:path"


const optimizeImage = async (req, res, next) => {
    if (!req.file) {                        // garde fou si PUT /api/books/:id => json pur sans image
        return next()
    }
    try {
        // le nom sans son extension d'origine
        const clearExtension = path.parse(req.file.originalname).name
        const clearName = clearExtension.split(' ').join('_')
        const name = `${clearName}_${Date.now()}.webp`

        const destination = path.join(import.meta.dirname, '..', 'images', name)

        await sharp(req.file.buffer)
            .resize({ width: 500, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(destination)

        req.file.filename = name
        next()
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: "Image invalide ou illisible" })
    }

}

export default optimizeImage