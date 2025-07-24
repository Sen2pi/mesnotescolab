const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Rechercher des utilisateurs par email ou nom
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche (email ou nom)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Utilisateurs trouvés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nom:
 *                         type: string
 *                       email:
 *                         type: string
 *                       avatar:
 *                         type: string
 *       400:
 *         description: Paramètre de recherche manquant
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche doit contenir au moins 2 caractères.'
      });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Rechercher par nom ou email, exclure l'utilisateur actuel
    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [
        { nom: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('nom email avatar')
    .limit(parseInt(limit))
    .sort({ nom: 1 });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'utilisateurs.'
    });
  }
});

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Récupérer les notifications de l'utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications récupérées
 */
router.get('/notifications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user._id;

    let query = { destinataire: userId };
    if (unreadOnly === 'true') {
      query.isLue = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .populate('expediteur', 'nom email avatar')
      .populate('noteId', 'titre')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          unreadCount
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications.'
    });
  }
});

/**
 * @swagger
 * /api/users/notifications/mark-read:
 *   patch:
 *     summary: Marquer des notifications comme lues
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs des notifications à marquer comme lues
 *               markAll:
 *                 type: boolean
 *                 description: Marquer toutes les notifications comme lues
 *     responses:
 *       200:
 *         description: Notifications marquées comme lues
 */
router.patch('/notifications/mark-read', auth, async (req, res) => {
  try {
    const { notificationIds, markAll } = req.body;
    const userId = req.user._id;

    let result;

    if (markAll) {
      // Marquer toutes les notifications non lues comme lues
      result = await Notification.updateMany(
        { destinataire: userId, isLue: false },
        { isLue: true }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marquer les notifications spécifiées comme lues
      result = await Notification.markAsRead(userId, notificationIds);
    } else {
      return res.status(400).json({
        success: false,
        message: 'IDs de notifications ou paramètre markAll requis.'
      });
    }

    res.json({
      success: true,
      message: 'Notifications marquées comme lues.',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications.'
    });
  }
});

/**
 * @swagger
 * /api/users/notifications/unread-count:
 *   get:
 *     summary: Obtenir le nombre de notifications non lues
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de notifications non lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */
router.get('/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications.'
    });
  }
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtenir les statistiques de l'utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalNotes:
 *                       type: integer
 *                     notesCreated:
 *                       type: integer
 *                     notesCollaborated:
 *                       type: integer
 *                     archivedNotes:
 *                       type: integer
 *                     publicNotes:
 *                       type: integer
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const Note = require('../models/Note');

    // Calculer différentes statistiques
    const [
      notesCreated,
      notesCollaborated,
      archivedNotes,
      publicNotes
    ] = await Promise.all([
      Note.countDocuments({ auteur: userId, isArchived: false }),
      Note.countDocuments({ 
        'collaborateurs.userId': userId, 
        isArchived: false 
      }),
      Note.countDocuments({ 
        $or: [
          { auteur: userId },
          { 'collaborateurs.userId': userId }
        ],
        isArchived: true 
      }),
      Note.countDocuments({ auteur: userId, isPublic: true })
    ]);

    const totalNotes = notesCreated + notesCollaborated;

    res.json({
      success: true,
      data: {
        totalNotes,
        notesCreated,
        notesCollaborated,
        archivedNotes,
        publicNotes
      }
    });

  } catch (error) {
    console.error('Erreur statistiques utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques.'
    });
  }
});

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Obtenir le profil public d'un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('nom email avatar createdAt derniereConnexion')
      .where('isActive', true);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Ne pas montrer l'email si ce n'est pas l'utilisateur connecté
    if (userId !== req.user._id.toString()) {
      user.email = undefined;
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil.'
    });
  }
});

module.exports = router;