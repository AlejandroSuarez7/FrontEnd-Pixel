import axios from 'axios';
import { notifications } from '../utils/notifications';

const BASE_URL = 'http://localhost:3000/';

// Instancia de Axios compartida por todos los módulos
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST: agrega el Bearer token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    // Ajusta esto según dónde guardas el token en tu proyecto
    // Opción A — localStorage directamente:
    const token = localStorage.getItem('token');

    // Opción B — si usas un store (Zustand, Redux, etc.):
    // const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: manejo global de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      // Token expirado o inválido — aquí puedes redirigir al login
      const authPaths = ['/login', '/register', '/reset-password', '/crear-password-cliente'];
      const isAuthPage = authPaths.some((path) => window.location.pathname.startsWith(path));

      console.warn('[API] No autorizado.');
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      console.warn('[API] Acceso denegado por permisos insuficientes.');
      notifications.error(message || 'No tienes permisos para realizar esta accion.');
    }

    // Lanza un error legible para los repositorios
    const apiError = new Error(
      status === 403
        ? message || 'No tienes permisos para realizar esta accion.'
        : message
    );
    apiError.status = status;
    apiError.payload = error.response?.data;
    apiError.response = error.response;
    apiError.isForbidden = status === 403;
    return Promise.reject(apiError);
  }
);
