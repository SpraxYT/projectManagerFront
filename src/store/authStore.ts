// Store Zustand pour l'authentification

import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CUSTOM';
  customRoleId?: string | null;
  customRole?: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    permissions: any;
  } | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.login({ email, password });
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.error || 'Erreur de connexion',
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.error || 'Erreur d\'inscription',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      // Même en cas d'erreur, on déconnecte l'utilisateur localement
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const response = await api.getMe();
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Ne pas afficher d'erreur si l'utilisateur n'est pas connecté
      });
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.refreshToken();
      if (response) {
        // Le token a été rafraîchi avec succès
        return;
      } else {
        // Échec du rafraîchissement, déconnecter
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// Hook pour vérifier les permissions
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Owner a toutes les permissions
    if (user.role === 'OWNER') return true;

    // Vérifier les permissions du rôle custom
    if (user.role === 'CUSTOM' && user.customRole) {
      return user.customRole.permissions[permission] === true;
    }

    // Pour les rôles prédéfinis, on pourrait avoir une logique similaire
    // Pour l'instant, on retourne false pour les non-custom
    return false;
  };

  return { hasPermission };
}
