import bcrypt from "bcrypt"
import User from "../models/User.js"
import jwt from "jsonwebtoken"


export const signup = async (req, res, next) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10)
        const user = new User({
            email: req.body.email,
            password: hash
        })
        await user.save()
        res.status(201).json({ message: 'Utilisateur créé' })
    } catch (error) {

        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message })
        }
        console.error(error)
        res.status(500).json({ error: "Une erreur est survenue" })
    }
}

export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({email:  req.body.email})

        if (user === null) {
            return res.status(401).json({ message: "Paire identifiant/mot de passe incorrecte" })
        }

        const valid = await bcrypt.compare(req.body.password, user.password)

        if (!valid) {
            return res.status(401).json({ message: "Paire identifiant/mot de passe incorrecte" })
        }
        res.status(200).json({
            userId: user._id,
            token: jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            )
        })
    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Une erreur est survenue"})
    }
}




