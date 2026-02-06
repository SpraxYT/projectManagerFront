// Client API pour communiquer avec le backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiError {
  error: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // Charger le token depuis localStorage (côté client uniquement)
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  /**
   * Définir le token d'accès
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  /**
   * Requête HTTP générique
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error: any) {
      // Si erreur 401, supprimer le token
      if (error.status === 401) {
        this.setAccessToken(null);
      }
      throw error;
    }
  }

  /**
   * GET
   */
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST
   */
  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT
   */
  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE
   */
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.post<any>('/auth/register', data);
    if (response.tokens) {
      this.setAccessToken(response.tokens.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
      }
    }
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.post<any>('/auth/login', data);
    if (response.tokens) {
      this.setAccessToken(response.tokens.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
      }
    }
    return response;
  }

  async refreshToken() {
    if (typeof window === 'undefined') return null;
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await this.post<any>('/auth/refresh', { refreshToken });
      if (response.accessToken) {
        this.setAccessToken(response.accessToken);
      }
      return response;
    } catch (error) {
      // Si le refresh échoue, déconnecter l'utilisateur
      this.logout();
      return null;
    }
  }

  async logout() {
    if (typeof window === 'undefined') return;
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await this.post('/auth/logout', { refreshToken });
      } catch (error) {
        // Ignorer les erreurs de logout
      }
    }

    this.setAccessToken(null);
    localStorage.removeItem('refreshToken');
  }

  async getMe() {
    return this.get<any>('/auth/me');
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.get<any>(`/users?${query}`);
  }

  async getUserById(id: string) {
    return this.get<any>(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.put<any>(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.delete<any>(`/users/${id}`);
  }

  async getUserActivityLogs(id: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.get<any>(`/users/${id}/activity?${query}`);
  }

  // ============================================================================
  // ROLE ENDPOINTS
  // ============================================================================

  async getRoles(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.get<any>(`/roles?${query}`);
  }

  async getRoleById(id: string) {
    return this.get<any>(`/roles/${id}`);
  }

  async createRole(data: any) {
    return this.post<any>('/roles', data);
  }

  async updateRole(id: string, data: any) {
    return this.put<any>(`/roles/${id}`, data);
  }

  async deleteRole(id: string) {
    return this.delete<any>(`/roles/${id}`);
  }

  async duplicateRole(id: string, name: string) {
    return this.post<any>(`/roles/${id}/duplicate`, { name });
  }

  // ============================================================================
  // SETTINGS ENDPOINTS
  // ============================================================================

  async getSettings() {
    return this.get<any>('/settings');
  }

  async updateSettings(data: any) {
    return this.put<any>('/settings', data);
  }
}

export const api = new ApiClient(API_URL);
