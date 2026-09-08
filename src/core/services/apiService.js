import axios from 'axios';
import { notifications } from '../utils/notifications';

const BASE_URL = '/api/';
export const SESSION_EXPIRED_EVENT = 'pixel:session-expired';
const AUTH_STORAGE_KEYS = ['token', 'pixel_user', 'pixel_permissions'];

// Instancia de Axios compartida por todos los modulos.
export const apiClient = axios.create({
  baseURL: BASE_URL,
});

export const prepareApiRequest = (config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Axios debe generar el Content-Type con su boundary para cuerpos multipart.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }

  return config;
};

export const clearStoredAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

// Interceptor de REQUEST: agrega el Bearer token automaticamente.
apiClient.interceptors.request.use(
  prepareApiRequest,
  (error) => Promise.reject(error)
);

export const handleApiError = (error) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      const authPaths = ['/login', '/register', '/reset-password', '/crear-password-cliente'];
      const isAuthPage = authPaths.some((path) => window.location.pathname.startsWith(path));
      const isAuthenticatedRequest = Boolean(error.config?.headers?.Authorization);

      console.warn('[API] No autorizado.');
      if (isAuthenticatedRequest && !isAuthPage) {
        clearStoredAuthSession();
      }
      if (!isAuthPage && !error.config?.skipAuthRedirect) {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      console.warn('[API] Acceso denegado por permisos insuficientes.');
      notifications.error(message || 'No tienes permisos para realizar esta accion.');
    }

    const apiError = new Error(
      status === 403
        ? message || 'No tienes permisos para realizar esta accion.'
        : message
    );
    apiError.status = status;
    apiError.payload = error.response?.data;
    apiError.response = error.response;
    apiError.isForbidden = status === 403;
    apiError.wasNotified = status === 403;
    apiError.isNetworkError = !error.response;
    apiError.code = error.code;
    return Promise.reject(apiError);
};

// Interceptor de RESPONSE: manejo global de errores.
apiClient.interceptors.response.use(
  (response) => response,
  handleApiError,
);
