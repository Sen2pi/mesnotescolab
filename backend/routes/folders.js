const express = require('express');
const Folder = require('../models/Folder');
const Note = require('../models/Note');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');
const { auth, checkFolderPermission } = require('../middleware/auth');
const { sendFolderInvitation } = require('../utils/email');

const router = express.Router();

/**
 * @swagger
 * /api/folders/workspace/{workspaceId}:
 *   get:
 *     summary: Récupérer tous les dossiers d'un workspace
 *     tags: [Folders]
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
 *     responses:
 *       200:
 *         description: Liste des dossiers
 */
router.get('/workspace/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { search } = req.query;
    const userId = req.user._id;

    // Vérifier l'accès au workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.hasPermission(userId, 'lecture')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé au workspace.'
      });
    }

    let folders;
    if (search) {
      folders = await Folder.searchFolders(workspaceId, userId, search);
    } else {
      folders = await Folder.findByWorkspace(workspaceId, userId);
    }

    res.json({
      success: true,
      data: folders
    });

  } catch (error) {
    console.error('Erreur récupération dossiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dossiers.'
    });
  }
});

/**
 * @swagger
 * /api/folders/workspace/{workspaceId}/hierarchy:
 *   get:
 *     summary: Récupérer la hiérarchie des dossiers d'un workspace
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hiérarchie des dossiers
 */
router.get('/workspace/:workspaceId/hierarchy', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    // Vérifier l'accès au workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.hasPermission(userId, 'lecture')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé au workspace.'
      });
    }

    const folders = await Folder.getHierarchy(workspaceId, userId);

    res.json({
      success: true,
      data: folders
    });

  } catch (error) {
    console.error('Erreur récupération hiérarchie dossiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la hiérarchie des dossiers.'
    });
  }
});

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Créer un nouveau dossier
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - workspace
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               workspace:
 *                 type: string
 *               parent:
 *                 type: string
 *               couleur:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Dossier créé avec succès
 */
router.post('/', auth, async (req, res) => {
  try {
    const { nom, description, workspace, parent, couleur = '#10b981', isPublic = false } = req.body;
    const userId = req.user._id;

    if (!nom || !workspace) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le workspace sont requis.'
      });
    }

    // Vérifier l'accès au workspace
    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc || !workspaceDoc.hasPermission(userId, 'ecriture')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé au workspace.'
      });
    }

    // Vérifier le dossier parent si spécifié
    if (parent) {
      const parentFolder = await Folder.findById(parent);
      if (!parentFolder || parentFolder.workspace.toString() !== workspace) {
        return res.status(400).json({
          success: false,
          message: 'Dossier parent invalide.'
        });
      }
    }

    const folder = new Folder({
      nom: nom.trim(),
      description: description?.trim(),
      workspace,
      proprietaire: userId,
      parent: parent || null,
      couleur,
      isPublic
    });

    await folder.save();
    await folder.populate('proprietaire', 'nom email avatar');
    await folder.populate('workspace', 'nom couleur');
    await folder.populate('parent', 'nom couleur');

    res.status(201).json({
      success: true,
      message: 'Dossier créé avec succès !',
      data: folder
    });

  } catch (error) {
    console.error('Erreur création dossier:', error);

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
      message: 'Erreur lors de la création du dossier.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}:
 *   get:
 *     summary: Récupérer un dossier par son ID
 *     tags: [Folders]
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
 *         description: Dossier trouvé
 */
router.get('/:id', auth, checkFolderPermission('lecture'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('proprietaire', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar')
      .populate('workspace', 'nom couleur')
      .populate('parent', 'nom couleur')
      .populate({
        path: 'enfants',
        populate: {
          path: 'enfants',
          populate: 'enfants'
        }
      });

    res.json({
      success: true,
      data: folder
    });

  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dossier.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     summary: Mettre à jour un dossier
 *     tags: [Folders]
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
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               couleur:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Dossier mis à jour
 */
router.put('/:id', auth, checkFolderPermission('ecriture'), async (req, res) => {
  try {
    const { nom, description, couleur, isPublic } = req.body;
    const folder = req.folder;

    if (nom !== undefined) folder.nom = nom.trim();
    if (description !== undefined) folder.description = description?.trim();
    if (couleur !== undefined) folder.couleur = couleur;
    if (isPublic !== undefined) folder.isPublic = isPublic;

    await folder.save();
    await folder.populate('proprietaire', 'nom email avatar');
    await folder.populate('collaborateurs.userId', 'nom email avatar');
    await folder.populate('workspace', 'nom couleur');
    await folder.populate('parent', 'nom couleur');

    res.json({
      success: true,
      message: 'Dossier mis à jour avec succès !',
      data: folder
    });

  } catch (error) {
    console.error('Erreur mise à jour dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du dossier.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Supprimer un dossier
 *     tags: [Folders]
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
 *         description: Dossier supprimé
 */
router.delete('/:id', auth, checkFolderPermission('admin'), async (req, res) => {
  try {
    const folderId = req.params.id;

    // Vérifier s'il y a des sous-dossiers
    const hasChildren = await Folder.exists({ parent: folderId });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un dossier qui contient des sous-dossiers.'
      });
    }

    // Vérifier s'il y a des notes
    const hasNotes = await Note.exists({ dossier: folderId });
    if (hasNotes) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un dossier qui contient des notes.'
      });
    }

    await Folder.findByIdAndDelete(folderId);

    res.json({
      success: true,
      message: 'Dossier supprimé avec succès !'
    });

  } catch (error) {
    console.error('Erreur suppression dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du dossier.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}/notes:
 *   get:
 *     summary: Récupérer toutes les notes d'un dossier
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des notes du dossier
 */
router.get('/:id/notes', auth, checkFolderPermission('lecture'), async (req, res) => {
  try {
    const { search } = req.query;
    const folderId = req.params.id;
    const userId = req.user._id;

    let notes;
    if (search) {
      // Recherche dans les notes du dossier
      notes = await Note.find({
        dossier: folderId,
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
      .populate('parent', 'titre couleur')
      .sort({ derniereActivite: -1 });
    } else {
      notes = await Note.findByFolder(folderId, userId);
    }

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('Erreur récupération notes dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes du dossier.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}/collaborators:
 *   post:
 *     summary: Ajouter un collaborateur au dossier
 *     tags: [Folders]
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
 *               permission:
 *                 type: string
 *                 enum: [lecture, ecriture, admin]
 *                 default: lecture
 *     responses:
 *       200:
 *         description: Collaborateur ajouté
 */
router.post('/:id/collaborators', auth, checkFolderPermission('admin'), async (req, res) => {
  try {
    const { email, permission = 'lecture' } = req.body;
    const folder = req.folder;

    // Trouver l'utilisateur par email
    const User = require('../models/User');
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Vérifier si l'utilisateur est déjà collaborateur
    const existingCollab = folder.collaborateurs.find(
      collab => collab.userId.toString() === user._id.toString()
    );

    if (existingCollab) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà collaborateur de ce dossier.'
      });
    }

    await folder.addCollaborator(user._id, permission);
    await folder.populate('collaborateurs.userId', 'nom email avatar');

    // Envoyer notification
    const notification = new Notification({
      destinataire: user._id,
      expediteur: req.user._id,
      type: 'invitation',
      message: `${req.user.nom} vous a invité à collaborer sur le dossier "${folder.nom}"`,
      metadata: { folderId: folder._id, permission }
    });
    await notification.save();

    // Envoyer email (non bloquant)
    sendFolderInvitation(
      user.email,
      req.user.nom,
      folder.nom,
      folder._id,
      permission
    ).catch(err => console.error('Erreur envoi email:', err));

    res.json({
      success: true,
      message: 'Collaborateur ajouté avec succès !',
      data: folder
    });

  } catch (error) {
    console.error('Erreur ajout collaborateur dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du collaborateur.'
    });
  }
});

/**
 * @swagger
 * /api/folders/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Supprimer un collaborateur du dossier
 *     tags: [Folders]
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
 *         description: Collaborateur supprimé
 */
router.delete('/:id/collaborators/:userId', auth, checkFolderPermission('admin'), async (req, res) => {
  try {
    const folder = req.folder;
    const { userId } = req.params;

    await folder.removeCollaborator(userId);
    await folder.populate('collaborateurs.userId', 'nom email avatar');

    res.json({
      success: true,
      message: 'Collaborateur supprimé avec succès !',
      data: folder
    });

  } catch (error) {
    console.error('Erreur suppression collaborateur dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du collaborateur.'
    });
  }
});

module.exports = router; 