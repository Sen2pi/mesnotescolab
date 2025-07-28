const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Workspace:
 *       type: object
 *       required:
 *         - nom
 *         - proprietaire
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du workspace
 *         nom:
 *           type: string
 *           description: Nom du workspace
 *         description:
 *           type: string
 *           description: Description du workspace
 *         proprietaire:
 *           type: string
 *           description: ID du propriétaire du workspace
 *         parent:
 *           type: string
 *           description: ID du workspace parent (pour les sous-workspaces)
 *         couleur:
 *           type: string
 *           description: Couleur du workspace
 *         isPublic:
 *           type: boolean
 *           description: Workspace public ou privé
 *         collaborateurs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               permission:
 *                 type: string
 *                 enum: [lecture, ecriture, admin]
 *         dateCreation:
 *           type: string
 *           format: date-time
 *         dateModification:
 *           type: string
 *           format: date-time
 */

const workspaceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null
  },
  couleur: {
    type: String,
    default: '#667eea',
    match: [/^#[0-9A-F]{6}$/i, 'Format de couleur invalide']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  collaborateurs: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['lecture', 'ecriture', 'admin'],
      default: 'lecture'
    },
    dateAjout: {
      type: Date,
      default: Date.now
    }
  }],
  derniereActivite: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
workspaceSchema.index({ proprietaire: 1, dateModification: -1 });
workspaceSchema.index({ parent: 1 });
workspaceSchema.index({ 'collaborateurs.userId': 1 });
workspaceSchema.index({ isPublic: 1 });
workspaceSchema.index({ nom: 'text', description: 'text' });

// Virtual pour les sous-workspaces
workspaceSchema.virtual('enfants', {
  ref: 'Workspace',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual pour les notes du workspace
workspaceSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'workspace'
});

// Virtual pour les dossiers du workspace
workspaceSchema.virtual('dossiers', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'workspace'
});

// Middleware pour mettre à jour la dernière activité
workspaceSchema.pre('save', function(next) {
  if (this.isModified('nom') || this.isModified('description')) {
    this.derniereActivite = new Date();
  }
  next();
});

// Méthodes d'instance
workspaceSchema.methods.addCollaborator = function(userId, permission = 'lecture') {
  // Vérifier si l'utilisateur est déjà collaborateur
  const existingCollab = this.collaborateurs.find(
    collab => collab.userId.toString() === userId.toString()
  );
  
  if (!existingCollab) {
    this.collaborateurs.push({ userId, permission });
  } else {
    existingCollab.permission = permission;
  }
  
  return this.save();
};

workspaceSchema.methods.removeCollaborator = function(userId) {
  this.collaborateurs = this.collaborateurs.filter(
    collab => collab.userId.toString() !== userId.toString()
  );
  return this.save();
};

workspaceSchema.methods.hasPermission = function(userId, requiredPermission = 'lecture') {
  // Le propriétaire a toutes les permissions
  if (this.proprietaire.toString() === userId.toString()) {
    return true;
  }
  
  // Vérifier les permissions des collaborateurs
  const collaborator = this.collaborateurs.find(
    collab => collab.userId.toString() === userId.toString()
  );
  
  if (!collaborator) {
    return this.isPublic && requiredPermission === 'lecture';
  }
  
  const permissions = {
    'lecture': ['lecture', 'ecriture', 'admin'],
    'ecriture': ['ecriture', 'admin'],
    'admin': ['admin']
  };
  
  return permissions[requiredPermission].includes(collaborator.permission);
};

// Méthodes statiques
workspaceSchema.statics.findByUser = function(userId, includePublic = false) {
  const query = {
    $or: [
      { proprietaire: userId },
      { 'collaborateurs.userId': userId }
    ]
  };
  
  if (includePublic) {
    query.$or.push({ isPublic: true });
  }
  
  return this.find(query)
    .populate('proprietaire', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('parent', 'nom couleur')
    .sort({ derniereActivite: -1 });
};

workspaceSchema.statics.getHierarchy = function(userId) {
  return this.findByUser(userId)
    .populate({
      path: 'enfants',
      populate: {
        path: 'enfants',
        populate: 'enfants'
      }
    });
};

workspaceSchema.statics.searchWorkspaces = function(userId, searchTerm) {
  return this.find({
    $and: [
      {
        $or: [
          { proprietaire: userId },
          { 'collaborateurs.userId': userId },
          { isPublic: true }
        ]
      },
      {
        $or: [
          { nom: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  })
  .populate('proprietaire', 'nom email avatar')
  .populate('collaborateurs.userId', 'nom email avatar')
  .populate('parent', 'nom couleur')
  .sort({ derniereActivite: -1 });
};

module.exports = mongoose.model('Workspace', workspaceSchema); 