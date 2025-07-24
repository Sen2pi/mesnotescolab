const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Note = require('../models/Note');

// Stockage des utilisateurs connectés par note
const noteRooms = new Map();

// Middleware d'authentification pour Socket.io
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Token manquant'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    
    if (!user || !user.isActive) {
      return next(new Error('Utilisateur invalide'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentification échouée'));
  }
};

// Vérifier les permissions sur une note
const checkNoteAccess = async (noteId, userId) => {
  try {
    const note = await Note.findById(noteId);
    if (!note) return false;
    
    return note.hasPermission(userId, 'lecture');
  } catch (error) {
    console.error('Erreur vérification permissions note:', error);
    return false;
  }
};

// Gestionnaire des événements Socket.io
const handleNoteSocket = (io) => {
  // Middleware d'authentification
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`👤 Utilisateur connecté: ${socket.user.nom} (${socket.id})`);

    // Rejoindre une note (room)
    socket.on('join-note', async (data) => {
      try {
        const { noteId } = data;
        
        if (!noteId) {
          socket.emit('error', { message: 'ID de note manquant' });
          return;
        }

        // Vérifier les permissions
        const hasAccess = await checkNoteAccess(noteId, socket.user._id);
        if (!hasAccess) {
          socket.emit('error', { message: 'Permissions insuffisantes' });
          return;
        }

        // Quitter les anciennes rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Rejoindre la nouvelle room
        socket.join(noteId);
        socket.currentNoteId = noteId;

        // Ajouter l'utilisateur à la liste des utilisateurs connectés
        if (!noteRooms.has(noteId)) {
          noteRooms.set(noteId, new Map());
        }
        
        const noteUsers = noteRooms.get(noteId);
        noteUsers.set(socket.id, {
          id: socket.user._id,
          nom: socket.user.nom,
          avatar: socket.user.avatar,
          socketId: socket.id,
          joinedAt: new Date()
        });

        // Informer les autres utilisateurs
        socket.to(noteId).emit('user-joined', {
          user: {
            id: socket.user._id,
            nom: socket.user.nom,
            avatar: socket.user.avatar
          }
        });

        // Envoyer la liste des utilisateurs connectés
        const connectedUsers = Array.from(noteUsers.values()).map(user => ({
          id: user.id,
          nom: user.nom,
          avatar: user.avatar
        }));

        socket.emit('note-joined', {
          noteId,
          connectedUsers
        });

        console.log(`📝 ${socket.user.nom} a rejoint la note ${noteId}`);

      } catch (error) {
        console.error('Erreur join-note:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion à la note' });
      }
    });

    // Modification en temps réel du contenu
    socket.on('content-change', async (data) => {
      try {
        const { noteId, content, selection, version } = data;
        
        if (!noteId || content === undefined) {
          socket.emit('error', { message: 'Données incomplètes' });
          return;
        }

        // Vérifier les permissions d'écriture
        const note = await Note.findById(noteId);
        if (!note || !note.hasPermission(socket.user._id, 'ecriture')) {
          socket.emit('error', { message: 'Permissions d\'écriture insuffisantes' });
          return;
        }

        // Vérifier la version pour éviter les conflits
        if (version && note.version > version) {
          socket.emit('version-conflict', {
            serverVersion: note.version,
            serverContent: note.contenu
          });
          return;
        }

        // Diffuser le changement aux autres utilisateurs connectés
        socket.to(noteId).emit('content-changed', {
          content,
          selection,
          version: note.version,
          changedBy: {
            id: socket.user._id,
            nom: socket.user.nom
          },
          timestamp: new Date()
        });

        // Mettre à jour l'activité de la note (sans sauvegarder le contenu en permanence)
        note.derniereActivite = new Date();
        await note.save();

      } catch (error) {
        console.error('Erreur content-change:', error);
        socket.emit('error', { message: 'Erreur lors de la modification' });
      }
    });

    // Position du curseur
    socket.on('cursor-position', (data) => {
      try {
        const { noteId, position, selection } = data;
        
        if (!noteId || !socket.currentNoteId || socket.currentNoteId !== noteId) {
          return;
        }

        socket.to(noteId).emit('cursor-moved', {
          position,
          selection,
          user: {
            id: socket.user._id,
            nom: socket.user.nom,
            avatar: socket.user.avatar
          }
        });

      } catch (error) {
        console.error('Erreur cursor-position:', error);
      }
    });

    // Sauvegarde manuelle
    socket.on('save-note', async (data) => {
      try {
        const { noteId, content, title } = data;
        
        if (!noteId) {
          socket.emit('error', { message: 'ID de note manquant' });
          return;
        }

        const note = await Note.findById(noteId);
        if (!note || !note.hasPermission(socket.user._id, 'ecriture')) {
          socket.emit('error', { message: 'Permissions d\'écriture insuffisantes' });
          return;
        }

        // Sauvegarder les modifications
        if (content !== undefined) note.contenu = content;
        if (title !== undefined) note.titre = title;
        
        await note.save();

        // Informer tous les utilisateurs de la sauvegarde
        io.to(noteId).emit('note-saved', {
          noteId,
          version: note.version,
          savedBy: {
            id: socket.user._id,
            nom: socket.user.nom
          },
          timestamp: new Date()
        });

        console.log(`💾 Note ${noteId} sauvegardée par ${socket.user.nom}`);

      } catch (error) {
        console.error('Erreur save-note:', error);
        socket.emit('error', { message: 'Erreur lors de la sauvegarde' });
      }
    });

    // Déconnexion ou changement de note
    socket.on('leave-note', () => {
      handleUserLeave(socket);
    });

    socket.on('disconnect', () => {
      console.log(`👋 Utilisateur déconnecté: ${socket.user.nom} (${socket.id})`);
      handleUserLeave(socket);
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
      console.error('Erreur Socket.io:', error);
    });
  });

  // Fonction pour gérer le départ d'un utilisateur
  const handleUserLeave = (socket) => {
    const noteId = socket.currentNoteId;
    
    if (noteId && noteRooms.has(noteId)) {
      const noteUsers = noteRooms.get(noteId);
      const userData = noteUsers.get(socket.id);
      
      if (userData) {
        noteUsers.delete(socket.id);
        
        // Informer les autres utilisateurs
        socket.to(noteId).emit('user-left', {
          user: {
            id: userData.id,
            nom: userData.nom,
            avatar: userData.avatar
          }
        });

        // Nettoyer si plus d'utilisateurs connectés
        if (noteUsers.size === 0) {
          noteRooms.delete(noteId);
        }

        console.log(`📤 ${userData.nom} a quitté la note ${noteId}`);
      }
    }
  };

  // Nettoyage périodique des rooms vides
  setInterval(() => {
    noteRooms.forEach((users, noteId) => {
      if (users.size === 0) {
        noteRooms.delete(noteId);
      }
    });
  }, 30000); // Toutes les 30 secondes
};

// Fonction utilitaire pour obtenir les utilisateurs connectés à une note
const getConnectedUsers = (noteId) => {
  if (!noteRooms.has(noteId)) return [];
  
  const noteUsers = noteRooms.get(noteId);
  return Array.from(noteUsers.values()).map(user => ({
    id: user.id,
    nom: user.nom,
    avatar: user.avatar
  }));
};

// Fonction pour envoyer une notification à tous les utilisateurs d'une note
const notifyNoteUsers = (io, noteId, event, data) => {
  io.to(noteId).emit(event, data);
};

module.exports = handleNoteSocket;
module.exports.getConnectedUsers = getConnectedUsers;
module.exports.notifyNoteUsers = notifyNoteUsers;