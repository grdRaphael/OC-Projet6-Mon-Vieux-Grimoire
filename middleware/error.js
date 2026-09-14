import multer from "multer";

/**
 * Traduit une exception en réponse HTTP.
 *
 * Deux règles, appliquées ici et nulle part ailleurs :
 *  - le tri se fait sur la NATURE de l'erreur, jamais sur l'endroit où elle survient ;
 *  - le client reçoit ce qui lui permet de corriger sa requête, et rien d'autre.
 *
 * Express reconnaît un middleware d'erreurs à ses quatre paramètres.
 */
const errorHandler = (err, req, res, next) => {

    // ---- Fautes du client : 400, avec de quoi se corriger ----

    if (err instanceof multer.MulterError) {          // garde-fous de l'upload
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "Image trop volumineuse (10 Mo maximum)" })
        }
        return res.status(400).json({ error: "Fichier invalide" })
    }

    if (err.message === "Type de fichier non supporté") {   // levée par le fileFilter
        return res.status(400).json({ error: err.message })
    }

    if (err.name === "ValidationError") {             // contrainte de schéma non respectée
        return res.status(400).json({ error: err.message })
    }

    if (err.name === "CastError") {                   // un identifiant qui n'est pas un ObjectId
        return res.status(400).json({ error: "Identifiant invalide" })
    }

    if (err instanceof SyntaxError) {                 // JSON malformé (express.json ou JSON.parse)
        return res.status(400).json({ error: "Données invalides" })
    }

    if (err.code === 11000) {                         // index unique violé : deux inscriptions
        return res.status(400).json({                // simultanées ont passé le validateur
            error: "Cette adresse email est déjà utilisée"
        })
    }

    // ---- Tout le reste : 500, et le client n'en saura rien ----
    // Un échec de connexion à Mongo porte l'adresse du cluster dans son message :
    // la trace complète reste côté serveur.
    console.error(err)
    res.status(500).json({ error: "Une erreur est survenue" })
}

export default errorHandler
