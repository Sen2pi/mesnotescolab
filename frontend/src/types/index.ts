// Types généraux de l'application
export interface User {
  _id: string;
  nom: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  derniereConnexion: string;
}

export interface Note {
  _id: string;
  titre: string;
  contenu: string;
  auteur: User;
  collaborateurs: Collaborator[];
  tags: string[];
  isPublic: boolean;
  isArchived: boolean;
  couleur: string;
  version: number;
  derniereActivite: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  userId: User;
  permission: 'lecture' | 'ecriture' | 'admin';
  dateAjout: string;
}

export interface Notification {
  _id: string;
  destinataire: string;
  expediteur?: User;
  type: 'partage' | 'modification' | 'commentaire' | 'invitation' | 'systeme';
  message: string;
  noteId?: Note;
  isLue: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotesResponse {
  notes: Note[];
  pagination: PaginationData;
}

export interface UserStats {
  totalNotes: number;
  notesCreated: number;
  notesCollaborated: number;
  archivedNotes: number;
  publicNotes: number;
}

// Types pour Socket.io
export interface SocketUser {
  id: string;
  nom: string;
  avatar?: string;
}

export interface ContentChangeData {
  noteId: string;
  content: string;
  selection?: {
    start: number;
    end: number;
  };
  version: number;
}

export interface ContentChangedData extends ContentChangeData {
  changedBy: SocketUser;
  timestamp: Date;
}

export interface CursorPosition {
  noteId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
}

export interface CursorMovedData extends CursorPosition {
  user: SocketUser;
}

export interface UserJoinedData {
  user: SocketUser;
}

export interface UserLeftData {
  user: SocketUser;
}

export interface NoteJoinedData {
  noteId: string;
  connectedUsers: SocketUser[];
}

export interface NoteSavedData {
  noteId: string;
  version: number;
  savedBy: SocketUser;
  timestamp: Date;
}

export interface VersionConflictData {
  serverVersion: number;
  serverContent: string;
}

// Types pour les formulaires
export interface LoginFormData {
  email: string;
  motDePasse: string;
}

export interface RegisterFormData {
  nom: string;
  email: string;
  motDePasse: string;
  confirmMotDePasse: string;
}

export interface CreateNoteFormData {
  titre: string;
  contenu: string;
  tags: string[];
  isPublic: boolean;
  couleur: string;
}

export interface UpdateNoteFormData extends Partial<CreateNoteFormData> {}

export interface AddCollaboratorFormData {
  email: string;
  permission: 'lecture' | 'ecriture' | 'admin';
}

export interface ChangePasswordFormData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmNouveauMotDePasse: string;
}

export interface UpdateProfileFormData {
  nom: string;
  avatar?: string;
}

// Types pour les filtres et recherches
export interface NotesFilters {
  search?: string;
  tags?: string[];
  archived?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchUsersParams {
  q: string;
  limit?: number;
}

// Types pour les thèmes
export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  info: string;
  success: string;
}

// Types pour les erreurs
export interface AppError {
  message: string;
  code?: string;
  field?: string;
}

// Types pour les états de chargement
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Types pour les actions Redux (si utilisé)
export interface BaseAction {
  type: string;
  payload?: any;
}

// Utilitaires TypeScript
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Types pour les hooks personnalisés
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseSocketState {
  connected: boolean;
  connectedUsers: SocketUser[];
  error: string | null;
}