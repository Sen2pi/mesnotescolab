# Mes Notes Colab 📝

Application collaborative de gestion de notes en temps réel développée avec Node.js, Express, MongoDB, React et Socket.io.

![Logo Mes Notes Colab](Logo.png)

## 🚀 Fonctionnalités

### 🔐 Authentification et Sécurité
- Inscription et connexion sécurisées avec JWT
- Chiffrement des mots de passe avec bcrypt
- Gestion des sessions utilisateur
- Protection des routes API

### 📝 Gestion des Notes
- Création, modification et suppression de notes
- Support du format Markdown avec aperçu en temps réel
- Système de tags pour l'organisation
- Notes publiques et privées
- Archivage des notes
- Recherche avancée dans le contenu

### 👥 Collaboration en Temps Réel
- Édition collaborative simultanée avec Socket.io
- Synchronisation instantanée des modifications
- Gestion des conflits de version
- Indication des utilisateurs connectés
- Permissions granulaires (lecture, écriture, admin)

### 🎨 Interface Moderne
- Design responsive avec Material-UI
- Animations fluides avec Framer Motion
- Thème personnalisé avec gradient
- Interface intuitive et moderne
- Support des appareils mobiles

### 📧 Notifications
- Système de notifications en temps réel
- Emails automatiques pour les invitations
- Notifications de modifications
- Alertes de collaboration

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** avec Express.js
- **MongoDB** avec Mongoose ODM
- **Socket.io** pour le temps réel
- **JWT** pour l'authentification
- **Bcrypt** pour le chiffrement
- **Nodemailer** pour les emails
- **Swagger** pour la documentation API

### Frontend
- **React 18** avec TypeScript
- **Material-UI (MUI)** pour les composants
- **Framer Motion** pour les animations
- **React Markdown** pour le rendu Markdown
- **Socket.io Client** pour la collaboration
- **Axios** pour les requêtes HTTP

## 📦 Installation et Configuration

### 🚀 Installation Rapide avec Docker (Recommandée)

**Prérequis :** Docker et Docker Compose

```bash
# Cloner et démarrer en une commande
git clone https://github.com/votre-username/mesnotescolab.git
cd mesnotescolab
make install
```

**C'est tout !** L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:5000  
- **Documentation Swagger** : http://localhost:5000/api-docs
- **Compte test** : `test@mesnotescolab.com` / `test123`

> 📚 **Guide complet Docker :** Voir [DOCKER.md](DOCKER.md) pour tous les détails

### 🛠️ Installation Manuelle (Développement)

**Prérequis :**
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 8.0.0

#### 1. Configuration du Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
npm run dev
```

#### 2. Configuration du Frontend  
```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

### 🐳 Commandes Docker Utiles

```bash
# Production
make up          # Démarrer l'application
make down        # Arrêter l'application
make logs        # Voir les logs

# Développement avec hot-reload
make dev-up      # Mode développement
make dev-logs    # Logs développement

# Maintenance
make clean       # Nettoyer les ressources
make db-backup   # Sauvegarder la base
```

## 📚 Documentation API

La documentation complète de l'API est disponible via Swagger UI à l'adresse :
`http://localhost:5000/api-docs`

### Endpoints principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour profil

#### Notes
- `GET /api/notes` - Liste des notes
- `POST /api/notes` - Créer une note
- `GET /api/notes/:id` - Récupérer une note
- `PUT /api/notes/:id` - Modifier une note
- `POST /api/notes/:id/collaborators` - Ajouter collaborateur

## 🌐 Architecture

```
mesnotescolab/
├── backend/                 # API Node.js
│   ├── models/             # Modèles MongoDB
│   ├── routes/             # Routes Express
│   ├── middleware/         # Middleware d'auth
│   ├── sockets/            # Logique Socket.io
│   └── server.js           # Point d'entrée
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── contexts/       # Contextes React
│   │   ├── services/       # Services API/Socket
│   │   └── types/          # Types TypeScript
│   └── public/             # Ressources statiques
└── README.md
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm start          # Lancement production
npm run dev        # Lancement développement avec nodemon
```

### Frontend
```bash
npm start          # Serveur de développement
npm run build      # Build de production
npm test           # Tests unitaires
```

---

**Mes Notes Colab** - Collaboration simplifiée pour vos notes 🚀

*Exercice technique pour stage développé avec les meilleures pratiques modernes*
