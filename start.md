# 🚀 Guide de Démarrage Rapide - Mes Notes Colab

## ⚡ Démarrage Express

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js** (version 18 ou supérieure) : https://nodejs.org/
- **MongoDB** : https://www.mongodb.com/try/download/community
- **Git** : https://git-scm.com/

### 2. Démarrage de MongoDB
```bash
# Windows
mongod

# macOS (avec Homebrew)
brew services start mongodb-community

# Linux (avec systemctl)
sudo systemctl start mongod
```

### 3. Installation des dépendances

**Backend :**
```bash
cd backend
npm install
```

**Frontend :**
```bash
cd frontend  
npm install
```

### 4. Configuration

**Backend** - Créer le fichier `backend/.env` :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mesnotescolab
JWT_SECRET=mon_secret_jwt_ultra_securise_2024
JWT_EXPIRES_IN=7d
EMAIL_USER=test@example.com
EMAIL_PASS=password_test
CLIENT_URL=http://localhost:3000
```

**Frontend** - Créer le fichier `frontend/.env` :
```env
REACT_APP_API_URL=http://localhost:5000
```

### 5. Lancement

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```

### 6. Accès à l'application

- **Application** : http://localhost:3000
- **API Swagger** : http://localhost:5000/api-docs
- **API Backend** : http://localhost:5000

## 🎯 Test Rapide

1. **Inscription** : Créez un compte sur http://localhost:3000/register
2. **Connexion** : Connectez-vous avec vos identifiants
3. **Créer une note** : Cliquez sur le bouton "+" pour créer votre première note
4. **Collaboration** : Partagez votre note avec un autre utilisateur
5. **Temps réel** : Ouvrez la même note dans deux onglets pour voir la synchronisation

## 🔧 Dépannage

### Erreurs communes :

**"MongoDB connection failed"**
- Vérifiez que MongoDB est démarré
- Vérifiez l'URL dans MONGODB_URI

**"Port 3000 already in use"**
```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :3000  # Windows
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

**"Module not found"**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Logs utiles :
- Backend : Les logs apparaîtront dans le terminal où vous avez lancé `npm run dev`
- Frontend : Ouvrez les DevTools du navigateur (F12)

## 📋 Fonctionnalités à Tester

### ✅ Authentification
- [x] Inscription avec validation des champs
- [x] Connexion avec JWT
- [x] Gestion des erreurs d'authentification
- [x] Déconnexion automatique en cas d'expiration

### ✅ Gestion des Notes
- [x] Création de notes avec Markdown
- [x] Modification en temps réel
- [x] Aperçu Markdown
- [x] Sauvegarde automatique
- [x] Suppression et archivage

### ✅ Collaboration
- [x] Partage de notes par email
- [x] Permissions (lecture, écriture, admin)
- [x] Synchronisation temps réel
- [x] Indicateurs de présence
- [x] Gestion des conflits

### ✅ Interface
- [x] Design responsive
- [x] Animations fluides
- [x] Thème moderne avec gradients
- [x] Notifications toast
- [x] Recherche et filtres

## 🎨 Captures d'écran

L'application présente :
- **Page de connexion** avec le logo Mes Notes Colab
- **Dashboard** avec statistiques et grille de notes
- **Éditeur collaboratif** avec aperçu Markdown
- **Gestion du profil** avec changement de mot de passe
- **Notifications** en temps réel

## 🚀 Prêt pour la Production

Pour un déploiement en production :

1. **Variables d'environnement sécurisées**
2. **Base de données MongoDB Atlas**
3. **Service d'email (SendGrid, etc.)**
4. **HTTPS avec certificats SSL**
5. **Load balancing pour Socket.io**

---

**Bon développement ! 🎉**

*Si vous rencontrez des problèmes, consultez les logs ou la documentation Swagger à http://localhost:5000/api-docs*