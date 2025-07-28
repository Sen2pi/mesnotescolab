const express = require('express');
const Workspace = require('../models/Workspace');
const Folder = require('../models/Folder');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const { auth, checkWorkspacePermission } = require('../middleware/auth');
const { sendWorkspaceInvitation } = require('../utils/email');

const router = express.Router();

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Récupérer tous les workspaces de l'utilisateur
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: includePublic
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Liste des workspaces
 */
router.get('/', auth, async (req, res) => {
  try {
    const { search, includePublic = false } = req.query;
    const userId = req.user._id;

    let workspaces;
    if (search) {
      workspaces = await Workspace.searchWorkspaces(userId, search);
    } else {
      workspaces = await Workspace.findByUser(userId, includePublic === 'true');
    }

    res.json({
      success: true,
      data: workspaces
    });

  } catch (error) {
    console.error('Erreur récupération workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des workspaces.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces/hierarchy:
 *   get:
 *     summary: Récupérer la hiérarchie des workspaces
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hiérarchie des workspaces
 */
router.get('/hierarchy', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.getHierarchy(userId);

    res.json({
      success: true,
      data: workspaces
    });

  } catch (error) {
    console.error('Erreur récupération hiérarchie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la hiérarchie.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Créer un nouveau workspace
 *     tags: [Workspaces]
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
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               parent:
 *                 type: string
 *               couleur:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Workspace créé avec succès
 */
router.post('/', auth, async (req, res) => {
  try {
    const { nom, description, parent, couleur = '#667eea', isPublic = false } = req.body;

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis.'
      });
    }

    const workspace = new Workspace({
      nom: nom.trim(),
      description: description?.trim(),
      proprietaire: req.user._id,
      parent: parent || null,
      couleur,
      isPublic
    });

    await workspace.save();
    await workspace.populate('proprietaire', 'nom email avatar');
    await workspace.populate('parent', 'nom couleur');

    res.status(201).json({
      success: true,
      message: 'Workspace créé avec succès !',
      data: workspace
    });

  } catch (error) {
    console.error('Erreur création workspace:', error);

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
      message: 'Erreur lors de la création du workspace.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Récupérer un workspace par son ID
 *     tags: [Workspaces]
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
 *         description: Workspace trouvé
 */
router.get('/:id', auth, checkWorkspacePermission('lecture'), async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('proprietaire', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar')
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
      data: workspace
    });

  } catch (error) {
    console.error('Erreur récupération workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du workspace.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: Mettre à jour un workspace
 *     tags: [Workspaces]
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
 *         description: Workspace mis à jour
 */
router.put('/:id', auth, checkWorkspacePermission('ecriture'), async (req, res) => {
  try {
    const { nom, description, couleur, isPublic } = req.body;
    const workspace = req.workspace;

    if (nom !== undefined) workspace.nom = nom.trim();
    if (description !== undefined) workspace.description = description?.trim();
    if (couleur !== undefined) workspace.couleur = couleur;
    if (isPublic !== undefined) workspace.isPublic = isPublic;

    await workspace.save();
    await workspace.populate('proprietaire', 'nom email avatar');
    await workspace.populate('collaborateurs.userId', 'nom email avatar');
    await workspace.populate('parent', 'nom couleur');

    res.json({
      success: true,
      message: 'Workspace mis à jour avec succès !',
      data: workspace
    });

  } catch (error) {
    console.error('Erreur mise à jour workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du workspace.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     summary: Supprimer un workspace
 *     tags: [Workspaces]
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
 *         description: Workspace supprimé
 */
router.delete('/:id', auth, checkWorkspacePermission('admin'), async (req, res) => {
  try {
    const workspaceId = req.params.id;

    // Vérifier s'il y a des sous-workspaces
    const hasChildren = await Workspace.exists({ parent: workspaceId });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un workspace qui contient des sous-workspaces.'
      });
    }

    // Vérifier s'il y a des notes
    const hasNotes = await Note.exists({ workspace: workspaceId });
    if (hasNotes) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un workspace qui contient des notes.'
      });
    }

    // Vérifier s'il y a des dossiers
    const hasFolders = await Folder.exists({ workspace: workspaceId });
    if (hasFolders) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un workspace qui contient des dossiers.'
      });
    }

    await Workspace.findByIdAndDelete(workspaceId);

    res.json({
      success: true,
      message: 'Workspace supprimé avec succès !'
    });

  } catch (error) {
    console.error('Erreur suppression workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du workspace.'
    });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/collaborators:
 *   post:
 *     summary: Ajouter un collaborateur au workspace
 *     tags: [Workspaces]
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
router.post('/:id/collaborators', auth, checkWorkspacePermission('admin'), async (req, res) => {
  try {
    const { email, permission = 'lecture' } = req.body;
    const workspace = req.workspace;

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
    const existingCollab = workspace.collaborateurs.find(
      collab => collab.userId.toString() === user._id.toString()
    );

    if (existingCollab) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà collaborateur de ce workspace.'
      });
    }

    await workspace.addCollaborator(user._id, permission);
    await workspace.populate('collaborateurs.userId', 'nom email avatar');

    // Envoyer notification
    const notification = new Notification({
      destinataire: user._id,
      expediteur: req.user._id,
      type: 'invitation',
      message: `${req.user.nom} vous a invité à collaborer sur le workspace "${workspace.nom}"`,
      metadata: { workspaceId: workspace._id, permission }
    });
    await notification.save();

    // Envoyer email (non bloquant)
    sendWorkspaceInvitation(
      user.email,
      req.user.nom,
      workspace.nom,
      workspace._id,
      permission
    ).catch(err => console.error('Erreur envoi email:', err));

    res.json({
      success: true,
      message: 'Collaborateur ajouté avec succès !',
      data: workspace
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
 * /api/workspaces/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Supprimer un collaborateur du workspace
 *     tags: [Workspaces]
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
router.delete('/:id/collaborators/:userId', auth, checkWorkspacePermission('admin'), async (req, res) => {
  try {
    const workspace = req.workspace;
    const { userId } = req.params;

    await workspace.removeCollaborator(userId);
    await workspace.populate('collaborateurs.userId', 'nom email avatar');

    res.json({
      success: true,
      message: 'Collaborateur supprimé avec succès !',
      data: workspace
    });

  } catch (error) {
    console.error('Erreur suppression collaborateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du collaborateur.'
    });
  }
});

module.exports = router; 