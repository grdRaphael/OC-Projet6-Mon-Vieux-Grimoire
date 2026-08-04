import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "path"
import userRoutes from './routes/user.js'


const app = express()

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.log('Connexion à MongoDB échouée !', error.message));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.get('/', (req, res) => {
    res.json({message: "API OK"});
});

app.use('/api/auth', userRoutes)

app.use('/images', express.static(path.join(import.meta.dirname, 'images')));



export default app; 

