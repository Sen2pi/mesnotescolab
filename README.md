# 📝 Mes Notes Colab

![Logo Mes Notes Colab](Logo.png)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" />
  <img src="https://img.shields.io/badge/React-18+-blue?logo=react" />
  <img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker" />
  <img src="https://img.shields.io/badge/Collaboration-temps%20r%C3%A9el-orange?logo=socket.io" />
  <img src="https://img.shields.io/badge/License-MIT-brightgreen" />
</p>

---

## 🚀 Fonctionnalités Clés

- 🔐 **Authentification sécurisée** (JWT, Bcrypt, gestion de sessions)
- 📝 **Gestion complète des notes** (création, édition, suppression, archivage)
- 👥 **Édition collaborative en temps réel** (Socket.io)
- 📤 **Partage de notes** (invitation email, permissions)
- 🏷️ **Tags, recherche avancée, filtres**
- 📧 **Notifications en temps réel**
- 🎨 **Interface moderne, responsive, animations fluides**
- 🛠️ **API RESTful documentée (Swagger)**
- 🐳 **Dockerisation complète (dev & prod)**
- 🧰 **Scripts de maintenance, backup, monitoring**

---

## 🖥️ Aperçu de l'Application

- **Dashboard** : Vue d'ensemble, statistiques, accès rapide aux notes
- **Éditeur collaboratif** : Markdown, présence en temps réel, gestion des conflits
- **Gestion du profil** : Modification des infos, mot de passe, avatar
- **Notifications toast** : Collaboration, erreurs, succès
- **Recherche & Filtres** : Par titre, contenu, tags, statut (archivé, partagé, public)

---

## 🏗️ Architecture Visuelle

```mermaid
flowchart TD
  subgraph Utilisateur
    U1["👤 Utilisateur"]
  end
  U1 -- "Connexion / Inscription" --> FE["🌐 Frontend React"]
  FE -- "API REST / WebSocket" --> BE["🛠️ Backend Node.js"]
  BE -- "Données" --> DB[("🗄️ MongoDB")]
  BE -- "Notifications" --> MAIL["📧 Email (Nodemailer)"]
  FE -- "Socket.io" --- BE
  FE -- "Statique" --> NGINX["🔀 Nginx"]
  NGINX -- "Reverse Proxy" --> FE
  classDef cloud fill:#f9f,stroke:#333,stroke-width:2px;
  class NGINX,MAIL cloud;
```

---

## 🔄 Flux de Collaboration (Temps Réel)

```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant FE as Frontend (React)
  participant BE as Backend (Node.js)
  participant DB as MongoDB
  participant S as Socket.io
  participant M as Mailer

  U->>FE: S'inscrit / Se connecte
  FE->>BE: POST /api/auth/login
  BE->>DB: Vérifie utilisateur
  DB-->>BE: OK / KO
  BE-->>FE: JWT + User
  U->>FE: Crée une note
  FE->>BE: POST /api/notes
  BE->>DB: Sauvegarde note
  BE-->>FE: Note créée
  U->>FE: Invite un collaborateur
  FE->>BE: POST /api/notes/:id/collaborators
  BE->>M: Envoie email d'invitation
  M-->>U: Email reçu
  U->>FE: Modifie la note (collab)
  FE->>S: Emit content-change
  S->>BE: Synchronise note
  S->>FE: Broadcast modif en temps réel
  FE-->>U: Affiche modif instantanée
```

---

## 🗺️ Roadmap du Projet

```mermaid
gantt
title Roadmap de Mes Notes Colab
section MVP
Conception & Setup         :done,    des1, 2024-05-01, 3d
Authentification           :done,    des2, after des1, 2d
CRUD Notes                 :done,    des3, after des2, 2d
Collaboration temps réel   :done,    des4, after des3, 3d
Notifications              :done,    des5, after des4, 2d
section Améliorations
Recherche & Tags           :active,  des6, after des5, 2d
Interface Responsive       :active,  des7, after des6, 2d
Dockerisation              :done,    des8, after des7, 1d
Tests & QA                 :         des9, after des8, 2d
Déploiement                :         des10, after des9, 1d
```

---

## 📦 Installation & Démarrage

### 🚀 Installation Ultra-Rapide (Docker)

```bash
# 1. Cloner et démarrer en une commande
 git clone https://github.com/votre-username/mesnotescolab.git
 cd mesnotescolab
 make install
```

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Swagger** : http://localhost:5000/api-docs
- **Compte test** : `test@mesnotescolab.com` / `test123`

> 📚 Guide complet Docker : [DOCKER.md](DOCKER.md)

### 🛠️ Installation Manuelle (Développement)

```bash
# Backend
cd backend
npm install
cp .env.example .env # puis éditer .env
npm run dev

# Frontend
cd ../frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

---

## 🐳 Commandes Docker Utiles

```bash
make up         # Lancer l'application (prod)
make down       # Arrêter
make logs       # Logs
make dev-up     # Mode développement (hot-reload)
make dev-logs   # Logs dev
make clean      # Nettoyer
make db-backup  # Sauvegarder la base
```

---

## 📚 Documentation API (Swagger)

Swagger UI : http://localhost:5000/api-docs

### Endpoints principaux

- `POST /api/auth/register` : Inscription
- `POST /api/auth/login` : Connexion
- `GET /api/auth/me` : Profil
- `PUT /api/auth/profile` : Modifier profil
- `GET /api/notes` : Lister notes
- `POST /api/notes` : Créer note
- `GET /api/notes/:id` : Détail note
- `PUT /api/notes/:id` : Modifier note
- `POST /api/notes/:id/collaborators` : Ajouter collaborateur

---

## 👥 Collaboration en Temps Réel

- **Édition simultanée** : Plusieurs utilisateurs sur la même note
- **Synchronisation instantanée** : Modifs visibles en direct
- **Gestion des conflits** : Versioning, notifications
- **Indicateur de présence** : Avatars des connectés
- **Permissions** : Lecture, écriture, admin
- **Partage par email** : Invitation automatique

---

## 🔒 Sécurité

- **JWT** : Authentification sécurisée
- **Bcrypt** : Hash des mots de passe
- **Validation** : Données côté serveur
- **Protection des routes** : Middleware d'auth
- **CORS** : Sécurisé pour le frontend

---

## 🎨 Interface Moderne

- **Material-UI** : Composants élégants
- **Framer Motion** : Animations fluides
- **Responsive** : Desktop & mobile
- **Thème personnalisé** : Gradients, couleurs

---

## 🧪 Tests & Qualité

- **Frontend** : `npm test` (unitaires)
- **Backend** : `npm run test` (si tests présents)
- **Lint** : `npm run lint`

---

## 🆘 Dépannage & FAQ

- **MongoDB ne démarre pas** : Vérifiez Docker ou service local
- **Port déjà utilisé** : Libérez le port (3000 ou 5000)
- **Problème d'email** : Vérifiez les variables EMAIL_USER/EMAIL_PASS
- **Erreur CORS** : Vérifiez l'URL du frontend dans .env
- **Logs** : Utilisez `make logs` ou consultez les terminaux

---

## 📸 Exemples d'Utilisation

- **Créer une note** :
  1. Cliquez sur "+"
  2. Rédigez en Markdown
  3. Invitez un collaborateur
  4. Modifiez à plusieurs en temps réel

- **Rechercher une note** :
  1. Utilisez la barre de recherche
  2. Filtrez par tags ou statut

- **Archiver/Supprimer** :
  1. Cliquez sur l'icône correspondante dans le dashboard

---

## 📋 Fonctionnalités à Tester (Checklist)

- [x] Authentification JWT
- [x] Création/édition/suppression de notes
- [x] Collaboration temps réel
- [x] Partage & permissions
- [x] Notifications
- [x] Recherche, tags, filtres
- [x] Interface responsive
- [x] Dockerisation complète

---

## 📄 Licence

MIT

---

<p align="center"><b>Mes Notes Colab</b> – Collaboration simplifiée pour vos notes 🚀</p>
