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
      const Note = require('../models/Note');
      const noteId = req.params.id || req.params.noteId;
      
      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: 'ID de note manquant.'
        });
      }

      const note = await Note.findById(noteId);
      
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note introuvable.'
        });
      }

      if (!note.hasPermission(req.user._id, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour cette action.'
        });
      }

      req.note = note;
      next();
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
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
  rateLimit
};