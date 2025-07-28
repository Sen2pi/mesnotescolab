const express = require('express');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, checkNotePermission } = require('../middleware/auth');
const { sendNoteInvitation, sendNoteModificationNotification } = require('../utils/email');

const router = express.Router();

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Récupérer toutes les notes de l'utilisateur
 *     tags: [Notes]
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: archived
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Liste des notes
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
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     pagination:
 *                       type: object
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      archived = false
    } = req.query;

    const userId = req.user._id;
    let query = {
      $or: [
        { auteur: userId },
        { 'collaborateurs.userId': userId }
      ],
      isArchived: archived === 'true'
    };

    let notesQuery;

    if (search) {
      notesQuery = Note.searchNotes(userId, search);
    } else {
      notesQuery = Note.find(query);
    }

    // Filtrer par tags si spécifié
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      notesQuery = notesQuery.where('tags').in(tagArray);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notes = await notesQuery
      .populate('auteur', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar')
      .sort({ derniereActivite: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total pour la pagination
    const total = await Note.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotes: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes.'
    });
  }
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Créer une nouvelle note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - contenu
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               couleur:
 *                 type: string
 *                 default: '#ffffff'
 *     responses:
 *       201:
 *         description: Note créée avec succès
 *       400:
 *         description: Données invalides
 */
router.post('/', auth, async (req, res) => {
  try {
    const { 
      titre, 
      contenu, 
      tags = [], 
      isPublic = false, 
      couleur = '#ffffff',
      workspace,
      dossier,
      parent
    } = req.body;

    // Validation des données
    if (!titre || !contenu || !workspace) {
      return res.status(400).json({
        success: false,
        message: 'Titre, contenu et workspace sont requis.'
      });
    }

    // Vérifier l'accès au workspace
    const Workspace = require('../models/Workspace');
    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc || !workspaceDoc.hasPermission(req.user._id, 'ecriture')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé au workspace.'
      });
    }

    // Vérifier le dossier si spécifié
    if (dossier) {
      const Folder = require('../models/Folder');
      const folderDoc = await Folder.findById(dossier);
      if (!folderDoc || folderDoc.workspace.toString() !== workspace) {
        return res.status(400).json({
          success: false,
          message: 'Dossier invalide.'
        });
      }
    }

    // Vérifier la note parent si spécifiée
    if (parent) {
      const parentNote = await Note.findById(parent);
      if (!parentNote || parentNote.workspace.toString() !== workspace) {
        return res.status(400).json({
          success: false,
          message: 'Note parent invalide.'
        });
      }
    }

    // Créer la nouvelle note
    const note = new Note({
      titre: titre.trim(),
      contenu: contenu.trim(),
      auteur: req.user._id,
      workspace,
      dossier: dossier || null,
      parent: parent || null,
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      isPublic,
      couleur
    });

    await note.save();
    
    // Mettre à jour les références croisées
    await note.updateReferences();
    
    // Peupler les références pour la réponse
    await note.populate('auteur', 'nom email avatar');
    await note.populate('workspace', 'nom couleur');
    await note.populate('dossier', 'nom couleur');
    await note.populate('parent', 'titre couleur');

    res.status(201).json({
      success: true,
      message: 'Note créée avec succès !',
      data: note
    });

  } catch (error) {
    console.error('Erreur création note:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Données invalides.',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la note.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Récupérer une note par son ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note trouvée
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Note non trouvée
 */
router.get('/:id', auth, checkNotePermission('lecture'), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('auteur', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar')
      .populate('workspace', 'nom couleur')
      .populate('dossier', 'nom couleur')
      .populate('parent', 'titre couleur')
      .populate('enfants', 'titre couleur derniereActivite')
      .populate('notesReferencees', 'titre couleur derniereActivite');

    res.json({
      success: true,
      data: note
    });

  } catch (error) {
    console.error('Erreur récupération note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la note.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Mettre à jour une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *               couleur:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note mise à jour
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Permissions insuffisantes
 */
router.put('/:id', auth, checkNotePermission('ecriture'), async (req, res) => {
  try {
    const { titre, contenu, tags, isPublic, couleur } = req.body;
    const note = req.note;

    // Sauvegarder les valeurs originales pour notifications
    const originalTitle = note.titre;
    const originalContent = note.contenu;

    // Mettre à jour les champs modifiés
    if (titre !== undefined) note.titre = titre.trim();
    if (contenu !== undefined) note.contenu = contenu.trim();
    if (tags !== undefined) {
      note.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    if (isPublic !== undefined) note.isPublic = isPublic;
    if (couleur !== undefined) note.couleur = couleur;

    await note.save();
    await note.populate('auteur', 'nom email avatar');
    await note.populate('collaborateurs.userId', 'nom email avatar');

    // Envoyer notifications aux collaborateurs si le contenu a changé
    if (contenu !== undefined && contenu !== originalContent) {
      const collaboratorIds = note.collaborateurs
        .map(collab => collab.userId._id)
        .filter(id => id.toString() !== req.user._id.toString());

      // Créer des notifications
      const notifications = collaboratorIds.map(userId => ({
        destinataire: userId,
        expediteur: req.user._id,
        type: 'modification',
        message: `${req.user.nom} a modifié la note "${note.titre}"`,
        noteId: note._id
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);

        // Envoyer emails (non bloquant)
        const collaboratorEmails = note.collaborateurs
          .filter(collab => collab.userId._id.toString() !== req.user._id.toString())
          .map(collab => collab.userId.email);

        collaboratorEmails.forEach(email => {
          sendNoteModificationNotification(
            email,
            req.user.nom,
            note.titre,
            note._id
          ).catch(err => console.error('Erreur envoi email:', err));
        });
      }
    }

    res.json({
      success: true,
      message: 'Note mise à jour avec succès !',
      data: note
    });

  } catch (error) {
    console.error('Erreur mise à jour note:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Données invalides.',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la note.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Supprimer une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note supprimée
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Note non trouvée
 */
router.delete('/:id', auth, checkNotePermission('admin'), async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    
    // Supprimer les notifications associées
    await Notification.deleteMany({ noteId: req.params.id });

    res.json({
      success: true,
      message: 'Note supprimée avec succès !'
    });

  } catch (error) {
    console.error('Erreur suppression note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la note.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/collaborators:
 *   post:
 *     summary: Ajouter un collaborateur à une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               permission:
 *                 type: string
 *                 enum: [lecture, ecriture, admin]
 *                 default: lecture
 *     responses:
 *       200:
 *         description: Collaborateur ajouté
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/:id/collaborators', auth, checkNotePermission('admin'), async (req, res) => {
  try {
    const { email, permission = 'lecture' } = req.body;
    const note = req.note;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis.'
      });
    }

    // Trouver l'utilisateur à ajouter
    const collaborator = await User.findOne({ email: email.toLowerCase() });
    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Vérifier que ce n'est pas l'auteur
    if (collaborator._id.toString() === note.auteur.toString()) {
      return res.status(400).json({
        success: false,
        message: 'L\'auteur ne peut pas être ajouté comme collaborateur.'
      });
    }

    // Ajouter ou mettre à jour le collaborateur
    await note.addCollaborator(collaborator._id, permission);
    await note.populate('collaborateurs.userId', 'nom email avatar');

    // Créer une notification
    const notification = await Notification.createNotification({
      destinataire: collaborator._id,
      expediteur: req.user._id,
      type: 'invitation',
      message: `${req.user.nom} vous a invité à collaborer sur "${note.titre}"`,
      noteId: note._id,
      metadata: { permission }
    });

    // Emitir notificação em tempo real via socket.io
    try {
      const { io } = require('../server');
      io.to(collaborator._id.toString()).emit('notification', notification);
    } catch (e) {
      console.error('Erreur émission notification socket.io:', e);
    }

    // Envoyer email d'invitation (non bloquant)
    sendNoteInvitation(
      collaborator.email,
      req.user.nom,
      note.titre,
      note._id,
      permission
    ).catch(err => console.error('Erreur envoi email invitation:', err));

    res.json({
      success: true,
      message: 'Collaborateur ajouté avec succès !',
      data: note
    });

  } catch (error) {
    console.error('Erreur ajout collaborateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du collaborateur.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Retirer un collaborateur d'une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collaborateur retiré
 *       403:
 *         description: Permissions insuffisantes
 */
router.delete('/:id/collaborators/:userId', auth, checkNotePermission('admin'), async (req, res) => {
  try {
    const note = req.note;
    const userId = req.params.userId;

    await note.removeCollaborator(userId);

    res.json({
      success: true,
      message: 'Collaborateur retiré avec succès !'
    });

  } catch (error) {
    console.error('Erreur suppression collaborateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du collaborateur.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/archive:
 *   patch:
 *     summary: Archiver/désarchiver une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note archivée/désarchivée
 */
router.patch('/:id/archive', auth, checkNotePermission('admin'), async (req, res) => {
  try {
    const note = req.note;
    note.isArchived = !note.isArchived;
    
    await note.save();

    res.json({
      success: true,
      message: `Note ${note.isArchived ? 'archivée' : 'désarchivée'} avec succès !`,
      data: note
    });

  } catch (error) {
    console.error('Erreur archivage note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage de la note.'
    });
  }
});

/**
 * @swagger
 * /api/notes/workspace/{workspaceId}:
 *   get:
 *     summary: Récupérer toutes les notes d'un workspace
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: dossier
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notes du workspace
 */
router.get('/workspace/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { search, dossier } = req.query;
    const userId = req.user._id;

    // Vérifier l'accès au workspace
    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.hasPermission(userId, 'lecture')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé au workspace.'
      });
    }

    let notes;
    if (dossier) {
      // Notes d'un dossier spécifique
      notes = await Note.findByFolder(dossier, userId);
    } else if (search) {
      // Recherche dans le workspace
      notes = await Note.find({
        workspace: workspaceId,
        $or: [
          { auteur: userId },
          { 'collaborateurs.userId': userId },
          { isPublic: true }
        ],
        isArchived: false,
        $or: [
          { titre: { $regex: search, $options: 'i' } },
          { contenu: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      })
      .populate('auteur', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar')
      .populate('dossier', 'nom couleur')
      .populate('parent', 'titre couleur')
      .sort({ derniereActivite: -1 });
    } else {
      // Toutes les notes du workspace
      notes = await Note.findByWorkspace(workspaceId, userId);
    }

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('Erreur récupération notes workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/children:
 *   get:
 *     summary: Récupérer les notes enfants d'une note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notes enfants
 */
router.get('/:id/children', auth, checkNotePermission('lecture'), async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user._id;

    const children = await Note.findChildren(noteId, userId);

    res.json({
      success: true,
      data: children
    });

  } catch (error) {
    console.error('Erreur récupération notes enfants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes enfants.'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/references:
 *   get:
 *     summary: Récupérer les notes qui référencent cette note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notes référencées
 */
router.get('/:id/references', auth, checkNotePermission('lecture'), async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user._id;

    const references = await Note.findReferences(noteId, userId);

    res.json({
      success: true,
      data: references
    });

  } catch (error) {
    console.error('Erreur récupération références:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des références.'
    });
  }
});

/**
 * @swagger
 * /api/notes/search:
 *   get:
 *     summary: Rechercher des notes par titre
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: workspace
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notes trouvées
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, workspace } = req.query;
    const userId = req.user._id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis.'
      });
    }

    let query = {
      $or: [
        { auteur: userId },
        { 'collaborateurs.userId': userId },
        { isPublic: true }
      ],
      isArchived: false,
      titre: { $regex: q, $options: 'i' }
    };

    if (workspace) {
      query.workspace = workspace;
    }

    const notes = await Note.find(query)
      .select('titre couleur workspace')
      .populate('workspace', 'nom couleur')
      .limit(10)
      .sort({ derniereActivite: -1 });

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('Erreur recherche notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche.'
    });
  }
});

module.exports = router;