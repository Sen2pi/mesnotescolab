const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       required:
 *         - titre
 *         - contenu
 *         - auteur
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la note
 *         titre:
 *           type: string
 *           description: Titre de la note
 *         contenu:
 *           type: string
 *           description: Contenu en Markdown de la note
 *         auteur:
 *           type: string
 *           description: ID de l'auteur de la note
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
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Étiquettes de la note
 *         isPublic:
 *           type: boolean
 *           description: Note publique ou privée
 *         isArchived:
 *           type: boolean
 *           description: Note archivée
 *         couleur:
 *           type: string
 *           description: Couleur de la note
 *         dateCreation:
 *           type: string
 *           format: date-time
 *         dateModification:
 *           type: string
 *           format: date-time
 *         version:
 *           type: number
 *           description: Version pour gestion conflits
 */

const noteSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxLength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu est requis'],
    maxLength: [50000, 'Le contenu ne peut pas dépasser 50000 caractères']
  },
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  dossier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null
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
  tags: [{
    type: String,
    trim: true,
    maxLength: [30, 'Un tag ne peut pas dépasser 30 caractères']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  couleur: {
    type: String,
    default: '#ffffff',
    match: [/^#[0-9A-F]{6}$/i, 'Format de couleur invalide']
  },
  version: {
    type: Number,
    default: 1
  },
  derniereActivite: {
    type: Date,
    default: Date.now
  },
  references: [{
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true
    },
    position: {
      start: Number,
      end: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
noteSchema.index({ auteur: 1, dateModification: -1 });
noteSchema.index({ workspace: 1, dateModification: -1 });
noteSchema.index({ dossier: 1, dateModification: -1 });
noteSchema.index({ parent: 1 });
noteSchema.index({ 'collaborateurs.userId': 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isPublic: 1, isArchived: 1 });
noteSchema.index({ titre: 'text', contenu: 'text' });
noteSchema.index({ 'references.noteId': 1 });

// Middleware pour mettre à jour la version et dernière activité
noteSchema.pre('save', function(next) {
  if (this.isModified('contenu') || this.isModified('titre')) {
    this.version += 1;
    this.derniereActivite = new Date();
  }
  next();
});

// Méthodes d'instance
noteSchema.methods.addCollaborator = function(userId, permission = 'lecture') {
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

noteSchema.methods.removeCollaborator = function(userId) {
  this.collaborateurs = this.collaborateurs.filter(
    collab => collab.userId.toString() !== userId.toString()
  );
  return this.save();
};

noteSchema.methods.hasPermission = function(userId, requiredPermission = 'lecture') {
  // L'auteur a toutes les permissions
  if (this.auteur.toString() === userId.toString()) {
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

// Virtual pour les notes enfants
noteSchema.virtual('enfants', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual pour les notes référencées
noteSchema.virtual('notesReferencees', {
  ref: 'Note',
  localField: 'references.noteId',
  foreignField: '_id'
});

// Méthodes statiques
noteSchema.statics.findByUser = function(userId, includePublic = false) {
  const query = {
    $or: [
      { auteur: userId },
      { 'collaborateurs.userId': userId }
    ],
    isArchived: false
  };
  
  if (includePublic) {
    query.$or.push({ isPublic: true });
  }
  
  return this.find(query)
    .populate('auteur', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('workspace', 'nom couleur')
    .populate('dossier', 'nom couleur')
    .populate('parent', 'titre couleur')
    .sort({ derniereActivite: -1 });
};

noteSchema.statics.searchNotes = function(userId, searchTerm) {
  return this.find({
    $and: [
      {
        $or: [
          { auteur: userId },
          { 'collaborateurs.userId': userId },
          { isPublic: true }
        ]
      },
      {
        $or: [
          { titre: { $regex: searchTerm, $options: 'i' } },
          { contenu: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ],
    isArchived: false
  })
  .populate('auteur', 'nom email avatar')
  .populate('collaborateurs.userId', 'nom email avatar')
  .populate('workspace', 'nom couleur')
  .populate('dossier', 'nom couleur')
  .populate('parent', 'titre couleur')
  .sort({ derniereActivite: -1 });
};

// Méthode pour trouver les notes par workspace
noteSchema.statics.findByWorkspace = function(workspaceId, userId) {
  const query = {
    workspace: workspaceId,
    $or: [
      { auteur: userId },
      { 'collaborateurs.userId': userId },
      { isPublic: true }
    ],
    isArchived: false
  };
  
  return this.find(query)
    .populate('auteur', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('dossier', 'nom couleur')
    .populate('parent', 'titre couleur')
    .sort({ derniereActivite: -1 });
};

// Méthode pour trouver les notes par dossier
noteSchema.statics.findByFolder = function(dossierId, userId) {
  const query = {
    dossier: dossierId,
    $or: [
      { auteur: userId },
      { 'collaborateurs.userId': userId },
      { isPublic: true }
    ],
    isArchived: false
  };
  
  return this.find(query)
    .populate('auteur', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('parent', 'titre couleur')
    .sort({ derniereActivite: -1 });
};

// Méthode pour trouver les notes enfants
noteSchema.statics.findChildren = function(noteId, userId) {
  const query = {
    parent: noteId,
    $or: [
      { auteur: userId },
      { 'collaborateurs.userId': userId },
      { isPublic: true }
    ],
    isArchived: false
  };
  
  return this.find(query)
    .populate('auteur', 'nom email avatar')
    .populate('collaborateurs.userId', 'nom email avatar')
    .populate('dossier', 'nom couleur')
    .sort({ derniereActivite: -1 });
};

// Méthode pour trouver les références croisées
noteSchema.statics.findReferences = function(noteId, userId) {
  return this.find({
    'references.noteId': noteId,
    $or: [
      { auteur: userId },
      { 'collaborateurs.userId': userId },
      { isPublic: true }
    ],
    isArchived: false
  })
  .populate('auteur', 'nom email avatar')
  .populate('collaborateurs.userId', 'nom email avatar')
  .populate('workspace', 'nom couleur')
  .populate('dossier', 'nom couleur')
  .sort({ derniereActivite: -1 });
};

// Méthode pour mettre à jour les références
noteSchema.methods.updateReferences = function() {
  const referencePattern = /\{\{([^}]+)\}\}/g;
  const references = [];
  let match;
  
  while ((match = referencePattern.exec(this.contenu)) !== null) {
    const noteTitle = match[1].trim();
    // Ici on pourrait chercher la note par titre et ajouter la référence
    // Pour l'instant, on stocke juste la position
    references.push({
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      noteTitle: noteTitle
    });
  }
  
  this.references = references;
  return this.save();
};

module.exports = mongoose.model('Note', noteSchema);