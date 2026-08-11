import multer from "multer";

const errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError){ // verifie si l'erreur vient de multer
        if(err.code === "LIMIT_FILE_SIZE"){
            return res.status(400).json({error: "Image trop voluminueuse (10 Mo maximum)"})
        }
        return res.status(400).json({error: "Fichier invalide"})            
    }

    if (err.message === 'Type de fichier non supporté'){
        return res.status(400).json({error: err.message})
    }

    console.error(err)
    res.status(500).json({error: "Une erreur est survenue"})
}

export default errorHandler
