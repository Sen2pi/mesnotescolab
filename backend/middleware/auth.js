const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Accès refusé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide. Utilisateur introuvable.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Compte désactivé.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expiré.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur.' 
    });
  }
};

// Middleware d'authentification optionnelle (pour les routes publiques)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-motDePasse');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

// Middleware de vérification des permissions sur une note
const checkNotePermission = (requiredPermission = 'lecture') => {
  return async (req, res, next) => {
    try {
      console.log('🔍 checkNotePermission - Verificando permissões');
      console.log('🔍 requiredPermission:', requiredPermission);
      console.log('🔍 userId:', req.user._id);
      
      const Note = require('../models/Note');
      const noteId = req.params.id || req.params.noteId;
      
      if (!noteId) {
        console.log('❌ ID de nota ausente');
        return res.status(400).json({
          success: false,
          message: 'ID de note manquant.'
        });
      }

      console.log('🔍 Buscando nota:', noteId);
      
      const note = await Note.findById(noteId)
        .populate('auteur', 'nom email avatar')
        .populate('collaborateurs.userId', 'nom email avatar')
        .populate('workspace', 'nom couleur')
        .populate('dossier', 'nom couleur')
        .populate('parent', 'titre couleur');
      
      if (!note) {
        console.log('❌ Nota não encontrada:', noteId);
        return res.status(404).json({
          success: false,
          message: 'Note introuvable.'
        });
      }

      console.log('🔍 Nota encontrada:', {
        id: note._id,
        titulo: note.titre,
        autor: note.auteur._id,
        autorNome: note.auteur.nom,
        colaboradores: note.collaborateurs.map(c => ({
          userId: c.userId._id,
          permission: c.permission
        }))
      });

      console.log('🔍 Verificando permissão:', {
        userId: req.user._id,
        requiredPermission,
        isAuthor: req.user._id.toString() === note.auteur._id.toString()
      });

      const hasPermission = note.hasPermission(req.user._id, requiredPermission);
      console.log('🔍 hasPermission result:', hasPermission);

      if (!hasPermission) {
        console.log('❌ Permissão negada para usuário:', req.user._id);
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour cette action.'
        });
      }

      console.log('✅ Permissão concedida');
      req.note = note;
      next();
    } catch (error) {
      console.error('❌ Erreur vérification permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.'
      });
    }
  };
};

// Middleware de vérification des permissions sur un workspace
const checkWorkspacePermission = (requiredPermission = 'lecture') => {
  return async (req, res, next) => {
    try {
      const Workspace = require('../models/Workspace');
      const workspaceId = req.params.id || req.params.workspaceId;
      
      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de workspace manquant.'
        });
      }

      const workspace = await Workspace.findById(workspaceId)
        .populate('proprietaire', 'nom email avatar')
        .populate('collaborateurs.userId', 'nom email avatar')
        .populate('parent', 'nom couleur');
      
      if (!workspace) {
        return res.status(404).json({
          success: false,
          message: 'Workspace introuvable.'
        });
      }

      if (!workspace.hasPermission(req.user._id, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour ce workspace.'
        });
      }

      req.workspace = workspace;
      next();
    } catch (error) {
      console.error('Erreur vérification permissions workspace:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.'
      });
    }
  };
};

// Middleware de vérification des permissions sur un dossier
const checkFolderPermission = (requiredPermission = 'lecture') => {
  return async (req, res, next) => {
    try {
      const Folder = require('../models/Folder');
      const folderId = req.params.id || req.params.folderId;
      
      if (!folderId) {
        return res.status(400).json({
          success: false,
          message: 'ID de dossier manquant.'
        });
      }

      const folder = await Folder.findById(folderId)
        .populate('proprietaire', 'nom email avatar')
        .populate('collaborateurs.userId', 'nom email avatar')
        .populate('workspace', 'nom couleur')
        .populate('parent', 'nom couleur');
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Dossier introuvable.'
        });
      }

      if (!folder.hasPermission(req.user._id, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour ce dossier.'
        });
      }

      req.folder = folder;
      next();
    } catch (error) {
      console.error('Erreur vérification permissions dossier:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.'
      });
    }
  };
};

// Middleware de limitation de débit simple
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Nettoyer les anciennes entrées
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    }
    
    const userRequests = requests.get(ip) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.'
      });
    }
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  checkNotePermission,
  checkWorkspacePermission,
  checkFolderPermission,
  rateLimit
};