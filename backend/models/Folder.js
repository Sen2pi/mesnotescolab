const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Folder:
 *       type: object
 *       required:
 *         - nom
 *         - workspace
 *         - proprietaire
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du dossier
 *         nom:
 *           type: string
 *           description: Nom du dossier
 *         description:
 *           type: string
 *           description: Description du dossier
 *         workspace:
 *           type: string
 *           description: ID du workspace auquel appartient le dossier
 *         proprietaire:
 *           type: string
 *           description: ID du propriétaire du dossier
 *         parent:
 *           type: string
 *           description: ID du dossier parent (pour les sous-dossiers)
 *         couleur:
 *           type: string
 *           description: Couleur du dossier
 *         isPublic:
 *           type: boolean
 *           description: Dossier public ou privé
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

const folderSchema = new mongoose.Schema({
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
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  couleur: {
    type: String,
    default: '#10b981',
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
folderSchema.index({ workspace: 1, dateModification: -1 });
folderSchema.index({ proprietaire: 1 });
folderSchema.index({ parent: 1 });
folderSchema.index({ 'collaborateurs.userId': 1 });
folderSchema.index({ isPublic: 1 });
folderSchema.index({ nom: 'text', description: 'text' });

// Virtual pour les sous-dossiers
folderSchema.virtual('enfants', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual pour les notes du dossier
folderSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'dossier'
});

// Middleware pour mettre à jour la dernière activité
folderSchema.pre('save', function(next) {
  if (this.isModified('nom') || this.isModified('description')) {
    this.derniereActivite = new Date();
  }
  next();
});

// Méthodes d'instance
folderSchema.methods.addCollaborator = function(userId, permission = 'lecture') {
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

folderSchema.methods.removeCollaborator = function(userId) {
  this.collaborateurs = this.collaborateurs.filter(
    collab => collab.userId.toString() !== userId.toString()
  );
  return this.save();
};

folderSchema.methods.hasPermission = function(userId, requiredPermission = 'lecture') {
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
folderSchema.statics.findByWorkspace = function(workspaceId, userId) {
  const query = {
    workspace: workspaceId,
    $or: [
      { proprietaire: userId },
      { 'collaborateurs.userId': userId },
      { isPublic: true }
    ]
  };
  
  return this.find(query)
    .populate('proprietaire', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('parent', 'nom couleur')
    .sort({ derniereActivite: -1 });
};

folderSchema.statics.getHierarchy = function(workspaceId, userId) {
  return this.findByWorkspace(workspaceId, userId)
    .populate({
      path: 'enfants',
      populate: {
        path: 'enfants',
        populate: 'enfants'
      }
    });
};

folderSchema.statics.searchFolders = function(workspaceId, userId, searchTerm) {
  return this.find({
    $and: [
      { workspace: workspaceId },
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

module.exports = mongoose.model('Folder', folderSchema); 