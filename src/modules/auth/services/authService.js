import { apiClient } from '../../../core/services/apiService.js';
import { PERMISSIONS_STORAGE_KEY, normalizePermissionCodes } from '../../../core/utils/permissions.js';

const TOKEN_KEY = 'token';
const USER_KEY  = 'pixel_user';
let permissionsRequest = null;
let permissionsRequestToken = null;

export const authService = {

  async login(correo, contrasena) {
    const { data } = await apiClient.post('/api/auth/login', { correo, contrasena });
    const { token, usuario } = data.data;
    localStorage.setItem(TOKEN_KEY, token);
    try {
      const permissionsSession = await this.fetchPermissions();
      const session = {
        ...usuario,
        permisos: permissionsSession.permisos,
        codigos: permissionsSession.codigos,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      this.logout();
      throw error;
    }
  },

  async fetchPermissions() {
    const currentToken = this.getToken();
    if (permissionsRequest && permissionsRequestToken === currentToken) {
      return permissionsRequest;
    }

    permissionsRequestToken = currentToken;
    const request = apiClient.get('/api/auth/me/permisos').then(({ data }) => {
      const sessionData = data.data || {};
      const codigos = normalizePermissionCodes(sessionData.codigos || sessionData.permisos || []);
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(codigos));
      return {
        usuario: sessionData.usuario || null,
        permisos: sessionData.permisos || [],
        codigos,
      };
    });
    permissionsRequest = request;

    try {
      return await request;
    } finally {
      if (permissionsRequest === request) {
        permissionsRequest = null;
        permissionsRequestToken = null;
      }
    }
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

  async forgotPassword(correo) {
    const { data } = await apiClient.post('/api/auth/forgot-password', { correo });
    return data;
  },

  async resetPassword(token, password) {
    const { data } = await apiClient.post('/api/auth/reset-password', { token, password });
    return data;
  },

  async createClientPassword(token, password) {
    const { data } = await apiClient.post('/api/auth/cliente/crear-password', { token, password });
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getSession() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const session = raw ? JSON.parse(raw) : null;
      if (!session) return null;

      const rawPermissions = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      const codigos = rawPermissions ? JSON.parse(rawPermissions) : session.codigos;
      return { ...session, codigos: normalizePermissionCodes(codigos) };
    } catch {
      return null;
    }
  },
};
