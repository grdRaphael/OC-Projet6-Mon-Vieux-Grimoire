import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
    try {
        if (!req.headers.authorization) {          //si token manquant, on a un undefined.split(' ')
            return res.status(401).json({ error: "Token manquant" })
        }
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
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