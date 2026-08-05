import multer from "multer"
import path from "node:path"

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}

const storage = multer.memoryStorage()

/*multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(import.meta.dirname, "..", "images")) // résultat: backend/images
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_')
        const extension = MIME_TYPES[file.mimetype]
        callback(null, name + Date.now() + '.' + extension)
    }
})*/

export default multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },        // 4 Mo maximum
  fileFilter: (req, file, callback) => {
    if (MIME_TYPES[file.mimetype]) {
      callback(null, true);                      // accepté
    } else {
      callback(new Error('Type de fichier non supporté'), false);
    }
  }
}).single('image');
