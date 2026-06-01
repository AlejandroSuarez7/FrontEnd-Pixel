import { apiClient } from '../../../core/services/apiService.js';

const TOKEN_KEY = 'token';
const USER_KEY  = 'pixel_user';

export const authService = {

  async login(correo, contrasena) {
    const { data } = await apiClient.post('/api/auth/login', { correo, contrasena });
    const { token, usuario } = data.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    return usuario;
  },

  // Campos requeridos por el backend: nombre, telefono, correo, contrasena
  async register(userData) {
    const { data } = await apiClient.post('/api/auth/register', {
      nombre:     userData.nombre,
      telefono:   userData.telefono,
      correo:     userData.correo,
      contrasena: userData.contrasena,
    });
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