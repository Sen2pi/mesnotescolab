// Script d'initialisation de MongoDB
print('🚀 Initialisation de MongoDB pour Mes Notes Colab...');

// Utiliser la base de données mesnotescolab
db = db.getSiblingDB('mesnotescolab');

// Créer un utilisateur pour l'application
db.createUser({
  user: 'mesnotescolab_user',
  pwd: 'mesnotescolab_password_2024',
  roles: [
    {
      role: 'readWrite',
      db: 'mesnotescolab'
    }
  ]
});

// Créer les collections avec validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nom', 'email', 'motDePasse'],
      properties: {
        nom: {
          bsonType: 'string',
          description: 'Le nom est requis et doit être une chaîne'
        },
        email: {
          bsonType: 'string',
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          description: 'Email valide requis'
        },
        motDePasse: {
          bsonType: 'string',
          minLength: 6,
          description: 'Mot de passe requis, minimum 6 caractères'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Statut d\'activation du compte'
        }
      }
    }
  }
});

db.createCollection('notes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['titre', 'contenu', 'auteur'],
      properties: {
        titre: {
          bsonType: 'string',
          maxLength: 100,
          description: 'Titre requis, maximum 100 caractères'
        },
        contenu: {
          bsonType: 'string',
          maxLength: 50000,
          description: 'Contenu requis, maximum 50000 caractères'
        },
        auteur: {
          bsonType: 'objectId',
          description: 'ID de l\'auteur requis'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Tableau de tags'
        },
        isPublic: {
          bsonType: 'bool',
          description: 'Statut public de la note'
        },
        isArchived: {
          bsonType: 'bool',
          description: 'Statut d\'archivage'
        }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['destinataire', 'type', 'message'],
      properties: {
        destinataire: {
          bsonType: 'objectId',
          description: 'ID du destinataire requis'
        },
        type: {
          bsonType: 'string',
          enum: ['partage', 'modification', 'commentaire', 'invitation', 'systeme'],
          description: 'Type de notification requis'
        },
        message: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Message requis, maximum 500 caractères'
        },
        isLue: {
          bsonType: 'bool',
          description: 'Statut de lecture'
        }
      }
    }
  }
});

// Créer les index pour améliorer les performances
print('📊 Création des index...');

// Index pour les utilisateurs
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

// Index pour les notes
db.notes.createIndex({ auteur: 1, updatedAt: -1 });
db.notes.createIndex({ 'collaborateurs.userId': 1 });
db.notes.createIndex({ tags: 1 });
db.notes.createIndex({ isPublic: 1, isArchived: 1 });
db.notes.createIndex({ titre: 'text', contenu: 'text' });

// Index pour les notifications
db.notifications.createIndex({ destinataire: 1, createdAt: -1 });
db.notifications.createIndex({ destinataire: 1, isLue: 1 });

// Insérer des données de test (optionnel)
print('🌱 Insertion de données de test...');

// Utilisateur de test
const testUserId = ObjectId();
db.users.insertOne({
  _id: testUserId,
  nom: 'Utilisateur Test',
  email: 'test@mesnotescolab.com',
  motDePasse: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3pb8l8DCle', // password: test123
  avatar: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  derniereConnexion: new Date()
});

// Note de test
db.notes.insertOne({
  titre: 'Note de bienvenue',
  contenu: '# Bienvenue dans Mes Notes Colab !\n\nCeci est votre première note collaborative. Vous pouvez :\n\n- **Écrire en Markdown**\n- Partager avec d\'autres utilisateurs\n- Collaborer en temps réel\n\n## Fonctionnalités\n\n- ✅ Édition collaborative\n- ✅ Synchronisation temps réel\n- ✅ Gestion des permissions\n- ✅ Notifications\n\nBonne collaboration ! 🚀',
  auteur: testUserId,
  collaborateurs: [],
  tags: ['bienvenue', 'guide', 'première-note'],
  isPublic: true,
  isArchived: false,
  couleur: '#667eea',
  version: 1,
  derniereActivite: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Initialisation MongoDB terminée avec succès !');
print('👤 Utilisateur de test créé : test@mesnotescolab.com / test123');
print('📝 Note de bienvenue créée');
print('🏃‍♂️ Prêt pour le développement !');