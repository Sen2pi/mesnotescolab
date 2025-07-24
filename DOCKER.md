# 🐳 Guide Docker - Mes Notes Colab

Ce guide explique comment utiliser Docker pour déployer et développer l'application Mes Notes Colab.

## 🚀 Démarrage Rapide

### Installation Ultra-Rapide
```bash
# Cloner le projet
git clone https://github.com/votre-repo/mesnotescolab.git
cd mesnotescolab

# Installation et démarrage automatique
make install
```

**C'est tout !** L'application sera disponible sur :
- 🌐 **Frontend** : http://localhost:3000
- 🔧 **Backend** : http://localhost:5000  
- 📚 **API Docs** : http://localhost:5000/api-docs
- 👤 **Compte test** : `test@mesnotescolab.com` / `test123`

## 📋 Prérequis

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Make** (optionnel, pour les raccourcis)

### Installation Docker

**Windows :**
- Télécharger Docker Desktop : https://www.docker.com/products/docker-desktop

**macOS :**
```bash
brew install --cask docker
```

**Linux (Ubuntu/Debian) :**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🏗️ Architecture Docker

```
mesnotescolab/
├── 🐳 docker-compose.yml          # Production
├── 🐳 docker-compose.dev.yml      # Développement  
├── 📁 backend/
│   ├── 🐳 Dockerfile              # Image production
│   ├── 🐳 Dockerfile.dev          # Image développement
│   └── 🔍 healthcheck.js          # Vérification santé
├── 📁 frontend/
│   ├── 🐳 Dockerfile              # Image Nginx + React
│   ├── 🐳 Dockerfile.dev          # Image développement
│   └── ⚙️ nginx.conf              # Configuration Nginx
├── 📁 docker/
│   └── 🗄️ mongo-init.js           # Init MongoDB
└── 📝 Makefile                    # Commandes simplifiées
```

## 🛠️ Commandes Principales

### Production

```bash
# Construction des images
make build
# ou
docker-compose build

# Démarrage
make up
# ou  
docker-compose up -d

# Arrêt
make down
# ou
docker-compose down

# Logs
make logs
# ou
docker-compose logs -f
```

### Développement

```bash
# Démarrage développement (hot-reload)
make dev-up
# ou
docker-compose -f docker-compose.dev.yml up -d

# Logs développement
make dev-logs

# Arrêt développement
make dev-down
```

### Maintenance

```bash
# Voir le statut
make status

# Nettoyer les ressources
make clean

# Nettoyage complet
make clean-all

# Sauvegarde base de données
make db-backup

# Accéder au shell MongoDB
make db-shell
```

## 🌐 Services Docker

### 🗄️ MongoDB
- **Port** : 27017
- **Admin** : admin / password123
- **Database** : mesnotescolab
- **Volume** : mongodb_data
- **Init** : docker/mongo-init.js

### 🔧 Backend (Node.js)
- **Port** : 5000
- **Health** : http://localhost:5000/api/health
- **API Docs** : http://localhost:5000/api-docs
- **Logs** : ./logs/

### 🌐 Frontend (React + Nginx)
- **Port** : 80 (mappé vers 3000)
- **Build** : Multi-stage avec optimisation
- **Proxy** : API vers backend:5000
- **WebSocket** : Socket.io vers backend

### 🔴 Redis (Optionnel)
- **Port** : 6379
- **Usage** : Cache, sessions, rate limiting
- **Volume** : redis_data

## ⚙️ Configuration

### Variables d'Environnement

**Production (.env) :**
```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/mesnotescolab?authSource=admin
JWT_SECRET=jwt_secret_production_ultra_securise
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

# Email
EMAIL_USER=noreply@mesnotescolab.com
EMAIL_PASS=password_production
```

**Développement (.env.dev) :**
```env  
NODE_ENV=development
MONGODB_URI=mongodb://mongodb-dev:27017/mesnotescolab_dev
JWT_SECRET=jwt_secret_dev_123
CLIENT_URL=http://localhost:3001
```

### Ports Utilisés

| Service | Production | Développement |
|---------|------------|---------------|
| Frontend | 3000 | 3001 |
| Backend | 5000 | 5001 |
| MongoDB | 27017 | 27018 |
| Redis | 6379 | 6380 |

## 🔍 Monitoring et Logs

### Healthchecks
Tous les services incluent des vérifications de santé :

```bash
# Vérifier la santé des services
docker-compose ps
# ou
make status
```

### Logs Détaillés
```bash
# Tous les services
make logs

# Service spécifique
make logs-backend
make logs-frontend  
make logs-db

# Développement avec suivi
make dev-logs
```

### Métriques
```bash
# Ressources utilisées
docker stats

# Espace disque des volumes
docker system df

# Informations détaillées
docker-compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🗄️ Gestion Base de Données

### Sauvegarde
```bash
# Sauvegarde automatique avec timestamp
make db-backup

# Sauvegarde manuelle
docker-compose exec mongodb mongodump \
  --uri="mongodb://admin:password123@localhost:27017/mesnotescolab?authSource=admin" \
  --out=/tmp/backup
```

### Restauration
```bash
# Restaurer depuis une sauvegarde
make db-restore BACKUP_DIR=./backups/backup-20240125_143022

# Restauration manuelle
docker-compose exec mongodb mongorestore \
  --uri="mongodb://admin:password123@localhost:27017/mesnotescolab?authSource=admin" \
  --drop /tmp/restore/mesnotescolab
```

### Accès Direct
```bash
# Shell MongoDB
make db-shell

# Commandes MongoDB utiles
db.users.countDocuments()
db.notes.find().limit(5)
db.notifications.deleteMany({isLue: true})
```

## 🧪 Tests

### Tests Automatisés
```bash
# Tous les tests
make test

# Backend uniquement
make test-backend

# Frontend uniquement  
make test-frontend
```

### Tests Manuels
```bash
# Accéder aux conteneurs
make shell-backend
make shell-frontend

# Tester la connectivité
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## 🚀 Déploiement Production

### Serveur Local
```bash
# Préparation
git clone https://github.com/votre-repo/mesnotescolab.git
cd mesnotescolab

# Configuration
cp .env.example .env
# Éditer .env avec vos valeurs

# Déploiement
make install
```

### Cloud (AWS/GCP/Azure)
```bash
# Adapter les variables d'environnement
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mesnotescolab"
export CLIENT_URL="https://votre-domaine.com"

# Build pour cloud
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Docker Swarm
```bash
# Initialiser Swarm
docker swarm init

# Déployer stack
docker stack deploy -c docker-compose.yml mesnotescolab

# Scaling
docker service scale mesnotescolab_backend=3
docker service scale mesnotescolab_frontend=2
```

## 🔧 Développement

### Hot Reload
Le mode développement inclut le rechargement automatique :

```bash
# Démarrer développement
make dev-up

# Modifier le code dans ./backend ou ./frontend
# Les changements sont automatiquement appliqués
```

### Debug
```bash
# Logs en temps réel
make dev-logs

# Shell dans les conteneurs
docker-compose -f docker-compose.dev.yml exec backend-dev sh
docker-compose -f docker-compose.dev.yml exec frontend-dev sh

# Variables d'environnement
docker-compose -f docker-compose.dev.yml exec backend-dev env
```

### Tests Intégration
```bash
# Base de données de test
docker-compose -f docker-compose.test.yml up -d

# Lancer les tests E2E
npm run test:e2e
```

## 🔒 Sécurité

### Bonnes Pratiques Implémentées
- ✅ **Utilisateurs non-root** dans les conteneurs
- ✅ **Secrets** via variables d'environnement
- ✅ **Images** optimisées et sécurisées
- ✅ **Healthchecks** pour tous les services
- ✅ **Réseau isolé** entre conteneurs
- ✅ **Volumes** persistants sécurisés

### Recommandations Production
```bash
# Scanner les vulnérabilités
docker scout cves mesnotescolab-backend
docker scout cves mesnotescolab-frontend

# Mettre à jour les images de base
docker-compose build --no-cache --pull

# Rotation des secrets
# Changer JWT_SECRET, mots de passe DB, etc.
```

## 🐛 Dépannage

### Problèmes Courants

**MongoDB ne démarre pas :**
```bash
# Vérifier les logs
make logs-db

# Permissions volumes
sudo chown -R 999:999 ./data/mongodb

# Réinitialiser
docker-compose down -v
docker-compose up -d
```

**Backend ne se connecte pas à MongoDB :**
```bash
# Vérifier la connectivité réseau
docker-compose exec backend ping mongodb

# Vérifier les variables d'environnement
docker-compose exec backend env | grep MONGODB
```

**Frontend ne charge pas :**
```bash
# Vérifier le build
docker-compose logs frontend

# Vérifier Nginx
docker-compose exec frontend nginx -t

# Rebuild frontend
docker-compose build --no-cache frontend
```

**Ports occupés :**
```bash
# Trouver les processus
sudo lsof -i :3000
sudo lsof -i :5000

# Modifier les ports dans docker-compose.yml
ports:
  - "3001:80"  # au lieu de 3000:80
```

### Commandes de Debug
```bash
# Inspecter les conteneurs
docker inspect mesnotescolab-backend

# Ressources système
docker system df
docker system events

# Réseau
docker network ls
docker network inspect mesnotescolab_mesnotescolab-network
```

## 📈 Performance

### Optimisations Production
- **Multi-stage builds** pour réduire la taille
- **Nginx** pour servir les fichiers statiques
- **Compression gzip** activée
- **Cache headers** pour les assets
- **Healthchecks** pour load balancing

### Monitoring
```bash
# Ressources en temps réel
docker stats

# Logs avec filtres
docker-compose logs --since 30m backend

# Métriques personnalisées
curl http://localhost:5000/api/health
```

## 🆘 Support

### Logs Utiles
```bash
# Export logs pour debug
docker-compose logs > logs_$(date +%Y%m%d_%H%M%S).txt

# Informations système
docker version
docker-compose version
docker system info
```

### Réinitialisation Complète
```bash
# ATTENTION: Supprime toutes les données !
make clean-all
make install
```

---

## 📚 Ressources

- **Docker** : https://docs.docker.com/
- **Docker Compose** : https://docs.docker.com/compose/
- **Best Practices** : https://docs.docker.com/develop/dev-best-practices/
- **Security** : https://docs.docker.com/engine/security/

---

**🐳 Docker pour Mes Notes Colab - Déploiement Simplifié !** 🚀