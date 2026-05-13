import { apiClient } from '../../../core/services/apiService.js';

const TOKEN_KEY = 'token';
const USER_KEY  = 'pixel_user';

export const authService = {

  async login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });

    // La respuesta esperada: { token: '...', user: { id, name, email, ... } }
    // Ajusta los campos si el backend devuelve algo distinto
    const { token, user } = data;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  },

  async register(userData) {
    const { data } = await apiClient.post('/auth/signup', {
      name:     userData.name,
      email:    userData.email,
      password: userData.password,
    });

    // signup normalmente solo confirma el registro, no loguea automáticamente
    // Si tu API devuelve token aquí también, guárdalo igual que en login
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getSession() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};