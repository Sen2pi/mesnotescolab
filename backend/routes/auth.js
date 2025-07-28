const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, rateLimit } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

const router = express.Router();

// Limiter les tentatives de connexion
const loginRateLimit = rateLimit(50, 15 * 60 * 1000); // 50 tentatives par 15 minutes (aumentado para desenvolvimento)
const registerRateLimit = rateLimit(20, 15 * 60 * 1000); // 20 tentatives par 15 minutes

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - email
 *               - motDePasse
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               motDePasse:
 *                 type: string
 *                 minLength: 6
 *                 example: motdepasse123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', registerRateLimit, async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;

    // Validation des données
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis.'
      });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères.'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà.'
      });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      motDePasse
    });

    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Envoyer email de bienvenue (non bloquant)
    sendWelcomeEmail(user.email, user.nom).catch(err => 
      console.error('Erreur envoi email bienvenue:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);

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
      message: 'Erreur interne du serveur.'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - motDePasse
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               motDePasse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants incorrects
 *       429:
 *         description: Trop de tentatives
 */
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Validation des données
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.'
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.'
      });
    }

    // Vérifier le compte actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(motDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Mettre à jour la dernière connexion
    user.updateLastLogin().catch(err => 
      console.error('Erreur mise à jour dernière connexion:', err)
    );

    res.json({
      success: true,
      message: 'Connexion réussie !',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtenir les informations de l'utilisateur connecté
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { nom, avatar } = req.body;
    const user = req.user;

    // Mise à jour des champs autorisés
    if (nom && nom.trim()) {
      user.nom = nom.trim();
    }
    
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès !',
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);

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
      message: 'Erreur interne du serveur.'
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Changer le mot de passe
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ancienMotDePasse
 *               - nouveauMotDePasse
 *             properties:
 *               ancienMotDePasse:
 *                 type: string
 *               nouveauMotDePasse:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Mot de passe changé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Ancien mot de passe incorrect
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = req.user;

    // Validation des données
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis.'
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      });
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await user.comparePassword(ancienMotDePasse);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Ancien mot de passe incorrect.'
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = nouveauMotDePasse;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès !'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.'
    });
  }
});

module.exports = router;