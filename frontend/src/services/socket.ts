import { io, Socket } from 'socket.io-client';
import {
  ContentChangeData,
  ContentChangedData,
  CursorPosition,
  CursorMovedData,
  UserJoinedData,
  UserLeftData,
  NoteJoinedData,
  NoteSavedData,
  VersionConflictData,
  SocketUser
} from '../types';

class SocketService {
  private socket: Socket | null = null;
  private currentNoteId: string | null = null;

  constructor() {
    this.connect();
  }

  connect(): void {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.warn('Tentative de connexion Socket sans token d\'authentification');
      return;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 10
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.io');
      this.emit('connectionStatus', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Déconnecté du serveur Socket.io:', reason);
      this.emit('connectionStatus', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.io:', error);
      this.emit('connectionError', error);
    });

    // Événements liés aux notes
    this.socket.on('note-joined', (data: NoteJoinedData) => {
      console.log(`📝 Rejoint la note ${data.noteId}`);
      this.emit('noteJoined', data);
    });

    this.socket.on('user-joined', (data: UserJoinedData) => {
      console.log(`👤 ${data.user.nom} a rejoint la note`);
      this.emit('userJoined', data);
    });

    this.socket.on('user-left', (data: UserLeftData) => {
      console.log(`👋 ${data.user.nom} a quitté la note`);
      this.emit('userLeft', data);
    });

    this.socket.on('content-changed', (data: ContentChangedData) => {
      this.emit('contentChanged', data);
    });

    this.socket.on('cursor-moved', (data: CursorMovedData) => {
      this.emit('cursorMoved', data);
    });

    this.socket.on('note-saved', (data: NoteSavedData) => {
      console.log(`💾 Note sauvegardée par ${data.savedBy.nom}`);
      this.emit('noteSaved', data);
    });

    this.socket.on('version-conflict', (data: VersionConflictData) => {
      console.warn('⚠️ Conflit de version détecté');
      this.emit('versionConflict', data);
    });

    // Événements d'erreur
    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ Erreur Socket:', error.message);
      this.emit('socketError', error);
    });
  }

  // === MÉTHODES DE CONNEXION AUX NOTES ===

  joinNote(noteId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket non connecté, impossible de rejoindre la note');
      return;
    }

    this.currentNoteId = noteId;
    this.socket.emit('join-note', { noteId });
  }

  leaveNote(): void {
    if (!this.socket?.connected || !this.currentNoteId) return;

    this.socket.emit('leave-note');
    this.currentNoteId = null;
  }

  // === MÉTHODES DE COLLABORATION ===

  sendContentChange(data: ContentChangeData): void {
    if (!this.socket?.connected) return;

    this.socket.emit('content-change', data);
  }

  sendCursorPosition(data: CursorPosition): void {
    if (!this.socket?.connected) return;

    this.socket.emit('cursor-position', data);
  }

  saveNote(noteId: string, content: string, title?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('save-note', { noteId, content, title });
  }

  // === GESTION DES ÉVÉNEMENTS ===

  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // === MÉTHODES UTILITAIRES ===

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentNoteId(): string | null {
    return this.currentNoteId;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentNoteId = null;
      this.eventListeners.clear();
    }
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  // Méthode pour changer le token d'authentification
  updateAuthToken(token: string): void {
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Obtenir les statistiques de connexion
  getConnectionStats(): {
    connected: boolean;
    currentNoteId: string | null;
    transportType: string | null;
  } {
    return {
      connected: this.isConnected(),
      currentNoteId: this.currentNoteId,
      transportType: this.socket?.io.engine.transport.name || null
    };
  }

  // Événements personnalisés pour la synchronisation de contenu
  onContentChanged(callback: (data: ContentChangedData) => void): void {
    this.on('contentChanged', callback);
  }

  onCursorMoved(callback: (data: CursorMovedData) => void): void {
    this.on('cursorMoved', callback);
  }

  onUserJoined(callback: (data: UserJoinedData) => void): void {
    this.on('userJoined', callback);
  }

  onUserLeft(callback: (data: UserLeftData) => void): void {
    this.on('userLeft', callback);
  }

  onNoteJoined(callback: (data: NoteJoinedData) => void): void {
    this.on('noteJoined', callback);
  }

  onNoteSaved(callback: (data: NoteSavedData) => void): void {
    this.on('noteSaved', callback);
  }

  onVersionConflict(callback: (data: VersionConflictData) => void): void {
    this.on('versionConflict', callback);
  }

  onConnectionStatus(callback: (data: { connected: boolean; reason?: string }) => void): void {
    this.on('connectionStatus', callback);
  }

  onSocketError(callback: (error: { message: string }) => void): void {
    this.on('socketError', callback);
  }
}

// Instance singleton du service Socket
export const socketService = new SocketService();
export default socketService;