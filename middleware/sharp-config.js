import sharp from "sharp"
import path from "node:path"

const ALLOWED_FORMATS = ["jpeg", "png", "webp", "heif", "gif", "tiff"]   

const optimizeImage = async (req, res, next) => {
    if (!req.file) {                        // garde fou si PUT /api/books/:id => json pur sans image
        return next()
    }

    // 1. Ce fichier est-il bien une image, et de quels format  ?
    let format
    try {
        format = (await sharp(req.file.buffer).metadata()).format 
        //metadata() est la méthode qui inspecte les octets
    } catch {
        return next(new Error("unsupported file type"))   // sharp n'y reconnaît aucune image
    }
    if (!ALLOWED_FORMATS.includes(format)) {
        return next(new Error("unsupported file type"))  // sharp reconnait une image, mais ce n'est pas un format autorisé
    }

    // 2. Conversion et écriture sur le disque.
    try {
        // le nom sans son extension d'origine
        const clearExtension = path.parse(req.file.originalname).name
        const clearName = clearExtension.split(' ').join('_')
        const name = `${clearName}_${Date.now()}.webp`

        const destination = path.join(import.meta.dirname, '..', 'images', name)

        await sharp(req.file.buffer)
            .resize({ width: 500, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(destination)                               // écris le résultat sur le disque, à cette adresse

        req.file.filename = name
        next()
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: "invalid or unreadable image" })
    }

}

export default optimizeImage
