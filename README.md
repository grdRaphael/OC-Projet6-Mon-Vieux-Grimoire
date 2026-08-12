# Mon Vieux Grimoire — API

API REST du site de notation de livres **Mon Vieux Grimoire**
(projet 7 du parcours Développeur Web — OpenClassrooms).

Elle gère l'authentification des utilisateurs, le catalogue de livres, l'envoi et
l'optimisation des couvertures, ainsi que le système de notation.

## Stack technique

| | |
|---|---|
| Exécution | Node.js 22 (modules ES) |
| Framework | Express 5 |
| Base de données | MongoDB Atlas via Mongoose 9 |
| Authentification | JSON Web Token |
| Mots de passe | bcrypt |
| Envoi de fichiers | Multer (stockage mémoire) |
| Traitement d'images | Sharp (conversion WebP) |

## Prérequis

- **Node.js 20 ou supérieur** (développé sous 22.23) — `node -v`
- Un **cluster MongoDB Atlas**. L'offre gratuite M0 suffit.
  Créez-en un sur [cloud.mongodb.com](https://cloud.mongodb.com), ajoutez un
  utilisateur de base de données, et autorisez votre adresse IP dans *Network Access*.

## Installation

```bash
git clone git@github.com:grdRaphael/OC-Projet6-Mon-Vieux-Grimoire.git
cd OC-Projet6-Mon-Vieux-Grimoire
npm install
```

### Configuration

Copiez le fichier d'exemple et renseignez vos propres valeurs :

```bash
cp .env.example .env
```

| Variable | Rôle | Exemple |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `4000` |
| `MONGO_URI` | Chaîne de connexion MongoDB, **nom de base inclus** | `mongodb+srv://user:pass@cluster.mongodb.net/mon-vieux-grimoire` |
| `JWT_SECRET` | Clé de signature des tokens | chaîne aléatoire longue |

Pour générer un secret solide :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> Le fichier `.env` n'est pas versionné : il contient des identifiants.

### Démarrage

```bash
npm start      # production
npm run dev    # développement (redémarrage automatique via nodemon)
```

Au démarrage, la console affiche :

```
Listening on port 4000
Connexion à MongoDB réussie !
```

> ⚠️ **Le port 4000 n'est pas modifiable en pratique** : le front l'utilise en dur
> (`src/utils/constants.js`). Changer `PORT` couperait la communication entre les deux.

## Lancer le front

Le front est fourni séparément :
[P7-Dev-Web-livres](https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres)

```bash
git clone https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres.git
cd P7-Dev-Web-livres
npm install
npm start        # http://localhost:3000
```

Les deux serveurs doivent tourner simultanément : l'API sur le port 4000, le front sur
le 3000.

> La base démarre vide. Créez un compte depuis la page *Inscription*, puis ajoutez vos
> premiers livres.

## Routes de l'API

### Authentification — `/api/auth`

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| `POST` | `/signup` | `{ email, password }` | `201` — compte créé |
| `POST` | `/login` | `{ email, password }` | `200` — `{ userId, token }` |

Le mot de passe est haché avec bcrypt avant enregistrement : il n'est jamais stocké en
clair. La connexion renvoie un token valable **24 heures**.

### Livres — `/api/books`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | — | Tous les livres |
| `GET` | `/bestrating` | — | Les 3 livres les mieux notés |
| `GET` | `/:id` | — | Un livre |
| `POST` | `/` | 🔒 | Créer un livre (multipart) |
| `PUT` | `/:id` | 🔒 | Modifier un livre |
| `DELETE` | `/:id` | 🔒 | Supprimer un livre |
| `POST` | `/:id/rating` | 🔒 | Noter un livre |

🔒 = en-tête `Authorization: Bearer <token>` requis.

**Création et modification** attendent du `multipart/form-data` :

| Champ | Contenu |
|---|---|
| `book` | l'objet livre sérialisé en JSON |
| `image` | le fichier de couverture |

La modification accepte aussi du JSON pur lorsque l'image reste inchangée.

**Notation** attend `{ userId, rating }` avec `rating` entier compris entre 0 et 5, et
renvoie le livre complet mis à jour. Un utilisateur ne peut noter un livre qu'une seule
fois.

## Modèle de données

```js
Book {
  userId        String    // propriétaire du livre
  title         String
  author        String
  imageUrl      String    // URL absolue vers la couverture
  year          Number
  genre         String
  ratings       [ { userId: String, grade: Number } ]
  averageRating Number
}

User {
  email     String  // unique
  password  String  // haché avec bcrypt
}
```

## Traitement des images

Les couvertures ne sont jamais enregistrées telles quelles :

1. **Multer** reçoit le fichier en mémoire — accepte `jpg`, `jpeg` et `png`, **10 Mo
   maximum**
2. **Sharp** le redimensionne à **500 px de large** (sans agrandissement) et le convertit
   en **WebP** (qualité 80)
3. Le fichier est écrit dans `images/` sous un nom horodaté, et son URL absolue est
   enregistrée en base

Sur un jeu de couvertures de test, cette chaîne réduit le poids des fichiers d'environ
**60 %**, ce qui répond à l'exigence d'éco-conception du projet.

Le dossier `images/` n'est pas versionné : un dépôt fraîchement cloné ne contient aucune
couverture.

## Sécurité

- Mots de passe hachés avec bcrypt (10 tours), jamais stockés ni renvoyés en clair
- Authentification par JWT signé, avec expiration à 24 h
- Le `userId` d'une requête est toujours lu **dans le token**, jamais dans le corps :
  un client ne peut pas se faire passer pour un autre utilisateur
- Seul le créateur d'un livre peut le modifier ou le supprimer
- Un utilisateur ne peut noter un livre qu'une fois ; les notes et la moyenne sont
  recalculées côté serveur et jamais reprises du client
- Secrets et identifiants exclusivement en variables d'environnement

## Structure du projet

```
.
├── server.js                 # création du serveur HTTP, gestion des erreurs de démarrage
├── app.js                    # configuration Express : middlewares, routes, connexion Mongo
├── models/                   # schémas Mongoose
├── routes/                   # déclaration des routes
├── controllers/              # logique métier
├── middleware/
│   ├── auth.js               # vérification du JWT
│   ├── multer-config.js      # réception du fichier
│   ├── sharp-config.js       # optimisation et conversion WebP
│   └── error.js              # gestion centralisée des erreurs
└── images/                   # couvertures uploadées (non versionnées)
```

## Codes de réponse

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Requête invalide (champ manquant, note hors bornes, fichier refusé) |
| `401` | Token absent, invalide ou expiré |
| `403` | Action interdite (livre appartenant à un autre utilisateur) |
| `404` | Ressource introuvable |
| `500` | Erreur serveur |
