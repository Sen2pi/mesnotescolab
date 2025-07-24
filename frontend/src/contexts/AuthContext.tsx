import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoadingState } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';

// Types pour le contexte d'authentification
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: LoadingState;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: LoadingState };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (nom: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { nom: string; avatar?: string }) => Promise<void>;
  changePassword: (ancienMotDePasse: string, nouveauMotDePasse: string) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// État initial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: 'idle',
  error: null,
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: 'loading',
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: 'success',
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: 'error',
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: 'idle',
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte d'authentification
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fonction pour vérifier le statut d'authentification
  const checkAuthStatus = async (): Promise<void> => {
    const token = apiService.getAuthToken();
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      dispatch({ type: 'LOGOUT' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: 'loading' });
      
      // Vérifier si le token est toujours valide
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Reconnecter le socket si nécessaire
        if (!socketService.isConnected()) {
          socketService.connect();
        }
      } else {
        throw new Error('Token invalide');
      }
    } catch (error: any) {
      console.error('Erreur vérification authentification:', error);
      dispatch({ type: 'LOGOUT' });
      apiService.removeAuthToken();
      socketService.disconnect();
    }
  };

  // Fonction de connexion
  const login = async (email: string, motDePasse: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await apiService.login({ email, motDePasse });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Sauvegarder le token et l'utilisateur
        apiService.setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        // Connecter le socket
        socketService.connect();
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error: any) {
      console.error('Erreur connexion:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (nom: string, email: string, motDePasse: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await apiService.register({ nom, email, motDePasse, confirmMotDePasse: motDePasse });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Sauvegarder le token et l'utilisateur
        apiService.setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        // Connecter le socket
        socketService.connect();
      } else {
        throw new Error(response.message || 'Erreur d\'inscription');
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = (): void => {
    dispatch({ type: 'LOGOUT' });
    apiService.removeAuthToken();
    socketService.disconnect();
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (data: { nom: string; avatar?: string }): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: 'loading' });

      const response = await apiService.updateProfile(data);

      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data });
        localStorage.setItem('user', JSON.stringify(response.data));
        dispatch({ type: 'SET_LOADING', payload: 'success' });
      } else {
        throw new Error(response.message || 'Erreur de mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      dispatch({ type: 'SET_LOADING', payload: 'error' });
      throw error;
    }
  };

  // Fonction de changement de mot de passe
  const changePassword = async (ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> => {
    try {
      const response = await apiService.changePassword({
        ancienMotDePasse,
        nouveauMotDePasse,
        confirmNouveauMotDePasse: nouveauMotDePasse
      });

      if (!response.success) {
        throw new Error(response.message || 'Erreur de changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      throw error;
    }
  };

  // Fonction pour effacer les erreurs
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;