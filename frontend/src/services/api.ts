import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  ApiResponse,
  User,
  Note,
  NotesResponse,
  Notification,
  UserStats,
  LoginFormData,
  RegisterFormData,
  CreateNoteFormData,
  UpdateNoteFormData,
  AddCollaboratorFormData,
  ChangePasswordFormData,
  UpdateProfileFormData,
  NotesFilters,
  SearchUsersParams
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les réponses et erreurs
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        // Retourner une erreur formatée
        const message = error.response?.data?.message || 'Une erreur est survenue';
        return Promise.reject({ message, status: error.response?.status });
      }
    );
  }

  // === AUTHENTIFICATION ===
  
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: UpdateProfileFormData): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>('/auth/profile', profileData);
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordFormData): Promise<ApiResponse> {
    const response = await this.api.put<ApiResponse>('/auth/change-password', passwordData);
    return response.data;
  }

  // === NOTES ===

  async getNotes(filters: NotesFilters = {}): Promise<ApiResponse<NotesResponse>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters.archived !== undefined) params.append('archived', filters.archived.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await this.api.get<ApiResponse<NotesResponse>>(`/notes?${params}`);
    return response.data;
  }

  async getNoteById(id: string): Promise<ApiResponse<Note>> {
    const response = await this.api.get<ApiResponse<Note>>(`/notes/${id}`);
    return response.data;
  }

  async createNote(noteData: CreateNoteFormData): Promise<ApiResponse<Note>> {
    const response = await this.api.post<ApiResponse<Note>>('/notes', noteData);
    return response.data;
  }

  async updateNote(id: string, noteData: UpdateNoteFormData): Promise<ApiResponse<Note>> {
    const response = await this.api.put<ApiResponse<Note>>(`/notes/${id}`, noteData);
    return response.data;
  }

  async deleteNote(id: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/notes/${id}`);
    return response.data;
  }

  async archiveNote(id: string): Promise<ApiResponse<Note>> {
    const response = await this.api.patch<ApiResponse<Note>>(`/notes/${id}/archive`);
    return response.data;
  }

  // === COLLABORATION ===

  async addCollaborator(noteId: string, collaboratorData: AddCollaboratorFormData): Promise<ApiResponse<Note>> {
    const response = await this.api.post<ApiResponse<Note>>(`/notes/${noteId}/collaborators`, collaboratorData);
    return response.data;
  }

  async removeCollaborator(noteId: string, userId: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/notes/${noteId}/collaborators/${userId}`);
    return response.data;
  }

  // === UTILISATEURS ===

  async searchUsers(params: SearchUsersParams): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.api.get<ApiResponse<User[]>>(`/users/search?${queryParams}`);
    return response.data;
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    const response = await this.api.get<ApiResponse<UserStats>>('/users/stats');
    return response.data;
  }

  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>(`/users/profile/${userId}`);
    return response.data;
  }

  // === NOTIFICATIONS ===

  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<ApiResponse<{
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
      unreadCount: number;
    };
  }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('unreadOnly', unreadOnly.toString());

    const response = await this.api.get(`/users/notifications?${params}`);
    return response.data;
  }

  async markNotificationsAsRead(notificationIds?: string[], markAll = false): Promise<ApiResponse> {
    const response = await this.api.patch('/users/notifications/mark-read', {
      notificationIds,
      markAll
    });
    return response.data;
  }

  async getUnreadNotificationsCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.api.get<ApiResponse<{ count: number }>>('/users/notifications/unread-count');
    return response.data;
  }

  // === MÉTHODES UTILITAIRES ===

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  // Upload d'images (si nécessaire)
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post<ApiResponse<{ url: string }>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Méthode pour tester la connexion à l'API
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Instance singleton de l'API
export const apiService = new ApiService();
export default apiService;