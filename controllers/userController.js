import bcrypt from "bcrypt"
import User from "../models/User.js"
import jwt from "jsonwebtoken"

// Aucun try/catch : Express 5 propage automatiquement le rejet d'un handler async
// vers le middleware d'erreurs, qui décide seul du code et du message.

export const signup = async (req, res) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password
    })

    await user.validate()

    user.password = await bcrypt.hash(user.password, 10)
    await user.save()
    res.status(201).json({ message: 'user created' })
}

export const login = async (req, res) => {
    const user = await User.findOne({ email: req.body.email }) 

    // Utilisateur inconnu et mot de passe faux renvoient le MÊME message :
    // les distinguer permettrait de reconstituer la liste des comptes existants.
    if (user === null) {
        return res.status(401).json({ message: "incorrect email/password pair" })
    }

    const valid = await bcrypt.compare(req.body.password, user.password)
    if (!valid) {
        return res.status(401).json({ message: "incorrect email/password pair" })
    }

    res.status(200).json({
        userId: user._id,
        token: jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )
    })
}
