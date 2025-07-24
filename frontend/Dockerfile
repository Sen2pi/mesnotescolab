# Dockerfile multi-stage pour le frontend React
# Stage 1: Build de l'application
FROM node:18-alpine AS builder

# Répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build de l'application
RUN npm run build

# Stage 2: Serveur de production avec Nginx
FROM nginx:1.25-alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/build /usr/share/nginx/html

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Exposer le port
EXPOSE 80

# Vérification de santé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]