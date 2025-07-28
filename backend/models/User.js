const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - nom
 *         - email
 *         - motDePasse
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'utilisateur
 *         nom:
 *           type: string
 *           description: Nom complet de l'utilisateur
 *         email:
 *           type: string
 *           description: Adresse email unique
 *         motDePasse:
 *           type: string
 *           description: Mot de passe chiffré
 *         avatar:
 *           type: string
 *           description: URL de l'avatar
 *         isActive:
 *           type: boolean
 *           description: Statut d'activation du compte
 *         dateCreation:
 *           type: string
 *           format: date-time
 *           description: Date de création du compte
 *         derniereConnexion:
 *           type: string
 *           format: date-time
 *           description: Date de dernière connexion
 */

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxLength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  idioma: {
    type: String,
    enum: ['pt', 'fr', 'en', 'de'],
    default: 'pt'
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minLength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  derniereConnexion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
userSchema.index({ email: 1 });

// Chiffrement du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.motDePasse);
};

// Méthode pour mettre à jour la dernière connexion
userSchema.methods.updateLastLogin = function() {
  this.derniereConnexion = new Date();
  return this.save();
};

// Masquer le mot de passe dans les réponses JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.motDePasse;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);