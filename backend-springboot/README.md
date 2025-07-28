# Mes Notes Colab - Spring Boot Backend

API collaborative pour la gestion de notes en temps réel convertie de Node.js vers Spring Boot avec Spring Security.

## 🚀 Fonctionnalités

- **Authentification JWT** avec Spring Security
- **Page de connexion personnalisée** avec logo
- **Gestion des utilisateurs** (inscription, connexion, profil)
- **Modèles JPA** pour User, Workspace, Folder, Note, Notification
- **API RESTful** avec documentation Swagger
- **Gestion des erreurs globale**
- **Rate limiting** pour la sécurité
- **Email service** pour notifications
- **Support H2 (dev) et PostgreSQL (prod)**

## 🏗️ Architecture

```
src/main/java/com/mesnotescolab/
├── MesNotesColabApplication.java       # Point d'entrée Spring Boot
├── config/                             # Configuration Spring Security, JWT, CORS
├── controller/                         # Contrôleurs REST et Web
├── dto/                               # Data Transfer Objects
├── entity/                            # Entités JPA
├── exception/                         # Gestion globale des erreurs
├── repository/                        # Repositories Spring Data JPA
└── service/                           # Services métier

src/main/resources/
├── static/                            # Ressources statiques (CSS, JS, images)
├── templates/                         # Templates Thymeleaf
├── application.properties             # Configuration développement
└── application-prod.properties        # Configuration production
```

## 🛠️ Technologies

- **Spring Boot 3.2.0** - Framework principal
- **Spring Security** - Authentification et autorisation
- **Spring Data JPA** - Persistance des données
- **JWT** - Gestion des tokens
- **H2 Database** - Base de données en mémoire (dev)
- **PostgreSQL** - Base de données production
- **Thymeleaf** - Moteur de templates
- **Swagger/OpenAPI** - Documentation API
- **Maven** - Gestion des dépendances

## 🚦 Démarrage rapide

### Prérequis
- Java 17+
- Maven 3.6+

### Installation

1. **Cloner le projet**
```bash
cd backend-springboot
```

2. **Installer les dépendances**
```bash
mvn clean install
```

3. **Configurer les variables d'environnement** (optionnel pour dev)
```bash
# JWT Secret (optionnel, une clé par défaut est fournie)
export JWT_SECRET=votre-secret-jwt

# Configuration email (optionnel pour dev)
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

4. **Démarrer l'application**
```bash
mvn spring-boot:run
```

L'application sera accessible sur `http://localhost:5000`

## 📚 Endpoints principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion API
- `GET /api/auth/me` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour profil
- `PUT /api/auth/change-password` - Changement mot de passe

### Pages Web
- `GET /login` - Page de connexion personnalisée
- `GET /dashboard` - Tableau de bord (nécessite authentification)

### Utilitaires
- `GET /api/health` - Status de l'application
- `GET /swagger-ui.html` - Documentation API
- `GET /h2-console` - Console H2 (dev uniquement)

## 🔐 Sécurité

### Authentification
- **JWT tokens** avec expiration configurable
- **Hachage bcrypt** des mots de passe (strength 12)
- **Rate limiting** sur les endpoints de connexion
- **CORS** configuré pour les domaines autorisés

### Validation
- **Bean Validation** sur tous les DTOs
- **Contraintes** de longueur et format
- **Validation email** avec regex

## 🗄️ Base de données

### Développement (H2)
- Base en mémoire rechargée à chaque démarrage
- Console accessible sur `/h2-console`
- Données SQL générées automatiquement

### Production (PostgreSQL)
```bash
# Variables d'environnement requises
export DATABASE_URL=jdbc:postgresql://localhost:5432/mesnotescolab
export DB_USERNAME=mesnotescolab
export DB_PASSWORD=your-password
```

## 📧 Configuration email

Pour activer les emails de bienvenue :

```properties
# Gmail SMTP
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.from=noreply@mesnotescolab.com
```

## 🚀 Déploiement

### Profile de production
```bash
java -jar target/mesnotescolab-backend-1.0.0.jar --spring.profiles.active=prod
```

### Variables d'environnement production
```bash
export SPRING_PROFILES_ACTIVE=prod
export DATABASE_URL=jdbc:postgresql://localhost:5432/mesnotescolab
export DB_USERNAME=mesnotescolab
export DB_PASSWORD=your-password
export JWT_SECRET=your-production-jwt-secret
export CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
export MAIL_HOST=smtp.your-provider.com
export MAIL_USERNAME=your-email
export MAIL_PASSWORD=your-password
```

## 🆚 Comparaison avec Node.js

| Fonctionnalité | Node.js | Spring Boot |
|---|---|---|
| **Framework** | Express.js | Spring Boot |
| **Authentification** | JWT + middleware custom | Spring Security + JWT |
| **Base de données** | MongoDB + Mongoose | JPA + H2/PostgreSQL |
| **Validation** | Validation manuelle | Bean Validation |
| **Documentation** | Swagger JSDoc | SpringDoc OpenAPI |
| **Rate Limiting** | Middleware custom | Bucket4j |
| **Email** | Nodemailer | Spring Mail |
| **Tests** | Jest | JUnit + Spring Test |

## 🧪 Tests

```bash
# Exécuter tous les tests
mvn test

# Tests avec couverture
mvn test jacoco:report
```

## 📝 Logs

Les logs sont configurés avec différents niveaux :
- **Development** : DEBUG pour l'application, INFO pour Spring
- **Production** : INFO pour l'application, WARN pour Spring

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

---

🔧 **Version Spring Boot** : Conversion complète de l'API Node.js vers Spring Boot avec toutes les fonctionnalités équivalentes et une page de connexion personnalisée avec le logo fourni.