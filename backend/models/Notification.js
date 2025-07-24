const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - destinataire
 *         - type
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la notification
 *         destinataire:
 *           type: string
 *           description: ID de l'utilisateur destinataire
 *         expediteur:
 *           type: string
 *           description: ID de l'utilisateur expéditeur
 *         type:
 *           type: string
 *           enum: [partage, modification, commentaire, invitation, systeme]
 *         message:
 *           type: string
 *           description: Contenu de la notification
 *         noteId:
 *           type: string
 *           description: ID de la note associée
 *         isLue:
 *           type: boolean
 *           description: Statut de lecture
 *         dateCreation:
 *           type: string
 *           format: date-time
 */

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    enum: ['partage', 'modification', 'commentaire', 'invitation', 'systeme'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxLength: [500, 'Le message ne peut pas dépasser 500 caractères']
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: false
  },
  isLue: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
notificationSchema.index({ destinataire: 1, createdAt: -1 });
notificationSchema.index({ destinataire: 1, isLue: 1 });

// Méthodes statiques
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Peupler les références avant de retourner
  await notification.populate([
    { path: 'expediteur', select: 'nom email avatar' },
    { path: 'noteId', select: 'titre' }
  ]);
  
  return notification;
};

notificationSchema.statics.markAsRead = function(userId, notificationIds) {
  return this.updateMany(
    { 
      destinataire: userId,
      _id: { $in: notificationIds }
    },
    { isLue: true }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    destinataire: userId,
    isLue: false
  });
};

// Middleware pour nettoyer les anciennes notifications
notificationSchema.statics.cleanupOldNotifications = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
    isLue: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);