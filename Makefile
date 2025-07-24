# Makefile pour Mes Notes Colab
.PHONY: help build up down logs clean dev prod test

# Variables
COMPOSE_FILE=docker-compose.yml
COMPOSE_DEV_FILE=docker-compose.dev.yml
PROJECT_NAME=mesnotescolab

# Aide
help: ## Afficher cette aide
	@echo "🚀 Mes Notes Colab - Commandes Docker"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Commandes de production
build: ## Construire les images Docker
	@echo "🏗️  Construction des images Docker..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache

up: ## Démarrer l'application en mode production
	@echo "🚀 Démarrage de l'application (production)..."
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "✅ Application démarrée !"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:5000"
	@echo "📚 API Docs: http://localhost:5000/api-docs"

down: ## Arrêter l'application
	@echo "🛑 Arrêt de l'application..."
	docker-compose -f $(COMPOSE_FILE) down

restart: ## Redémarrer l'application
	@echo "🔄 Redémarrage de l'application..."
	$(MAKE) down
	$(MAKE) up

# Commandes de développement
dev-build: ## Construire les images de développement
	@echo "🏗️  Construction des images de développement..."
	docker-compose -f $(COMPOSE_DEV_FILE) build --no-cache

dev-up: ## Démarrer en mode développement avec hot-reload
	@echo "🚀 Démarrage en mode développement..."
	docker-compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "✅ Environnement de développement démarré !"
	@echo "🌐 Frontend: http://localhost:3001"
	@echo "🔧 Backend: http://localhost:5001"

dev-down: ## Arrêter l'environnement de développement
	@echo "🛑 Arrêt de l'environnement de développement..."
	docker-compose -f $(COMPOSE_DEV_FILE) down

dev-logs: ## Voir les logs en mode développement
	docker-compose -f $(COMPOSE_DEV_FILE) logs -f

# Commandes de monitoring
logs: ## Voir les logs de l'application
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Voir les logs du backend uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Voir les logs du frontend uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Voir les logs de MongoDB
	docker-compose -f $(COMPOSE_FILE) logs -f mongodb

status: ## Voir le statut des conteneurs
	@echo "📊 Statut des conteneurs :"
	docker-compose -f $(COMPOSE_FILE) ps

# Commandes de maintenance
clean: ## Nettoyer les ressources Docker
	@echo "🧹 Nettoyage des ressources Docker..."
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker-compose -f $(COMPOSE_DEV_FILE) down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

clean-all: ## Nettoyage complet (images, conteneurs, volumes)
	@echo "🧹 Nettoyage complet..."
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans --rmi all
	docker-compose -f $(COMPOSE_DEV_FILE) down -v --remove-orphans --rmi all
	docker system prune -af
	docker volume prune -f

# Commandes de base de données
db-shell: ## Accéder au shell MongoDB
	@echo "🗄️  Connexion à MongoDB..."
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin mesnotescolab

db-backup: ## Sauvegarder la base de données
	@echo "💾 Sauvegarde de la base de données..."
	mkdir -p ./backups
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/mesnotescolab?authSource=admin" --out=/tmp/backup
	docker cp mesnotescolab-mongodb:/tmp/backup ./backups/backup-$(shell date +%Y%m%d_%H%M%S)
	@echo "✅ Sauvegarde terminée dans ./backups/"

db-restore: ## Restaurer la base de données (spécifier BACKUP_DIR=./backups/backup-xxx)
	@echo "🔄 Restauration de la base de données..."
	@if [ -z "$(BACKUP_DIR)" ]; then echo "❌ Spécifiez BACKUP_DIR=./backups/backup-xxx"; exit 1; fi
	docker cp $(BACKUP_DIR) mesnotescolab-mongodb:/tmp/restore
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/mesnotescolab?authSource=admin" --drop /tmp/restore/mesnotescolab
	@echo "✅ Restauration terminée"

# Commandes de test
test: ## Lancer les tests
	@echo "🧪 Lancement des tests..."
	docker-compose -f $(COMPOSE_FILE) exec backend npm test
	docker-compose -f $(COMPOSE_FILE) exec frontend npm test -- --coverage --watchAll=false

test-backend: ## Tests backend uniquement
	docker-compose -f $(COMPOSE_FILE) exec backend npm test

test-frontend: ## Tests frontend uniquement
	docker-compose -f $(COMPOSE_FILE) exec frontend npm test -- --coverage --watchAll=false

# Commandes utilitaires
shell-backend: ## Accéder au shell du conteneur backend
	docker-compose -f $(COMPOSE_FILE) exec backend sh

shell-frontend: ## Accéder au shell du conteneur frontend
	docker-compose -f $(COMPOSE_FILE) exec frontend sh

update: ## Mettre à jour et redéployer
	@echo "🔄 Mise à jour de l'application..."
	git pull
	$(MAKE) build
	$(MAKE) down
	$(MAKE) up
	@echo "✅ Mise à jour terminée !"

# Installation rapide
install: ## Installation complète (première fois)
	@echo "🚀 Installation de Mes Notes Colab..."
	@echo "1️⃣  Construction des images..."
	$(MAKE) build
	@echo "2️⃣  Démarrage des services..."
	$(MAKE) up
	@echo "3️⃣  Attente de l'initialisation (30s)..."
	sleep 30
	@echo "✅ Installation terminée !"
	@echo ""
	@echo "🎉 Mes Notes Colab est prêt !"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:5000"
	@echo "📚 API Docs: http://localhost:5000/api-docs"
	@echo "👤 Compte test: test@mesnotescolab.com / test123"

# Installation développement
install-dev: ## Installation environnement de développement
	@echo "🚀 Installation environnement de développement..."
	$(MAKE) dev-build
	$(MAKE) dev-up
	@echo "✅ Environnement de développement prêt !"
	@echo "🌐 Frontend: http://localhost:3001"
	@echo "🔧 Backend: http://localhost:5001"