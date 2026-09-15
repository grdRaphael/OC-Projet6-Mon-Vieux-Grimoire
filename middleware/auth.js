import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
    try {
        if (!req.headers.authorization) {          //si token manquant, on a un undefined.split(' ')
            return res.status(401).json({ error: "missing token" })
        }
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        /*RESULTAT DE jwt.verify :
        {
            userId: '6a74700e154bbebc4908d8ab',
                iat: 1788784533, (émis à 'nombre de seconde écoulées depuis le 1er janv 1970 à minuit')
                exp: 1788870933 (expire à)
        }*/

        const userId = decodedToken.userId
        req.auth = {
            userId: userId
        }
        next()
    } catch (error) {
        res.status(401).json({ error: error.message })
    }
}

export default auth