import { Navigate, useLocation } from 'react-router-dom';
import { ALLOWED_PATHS_BY_ROLE } from './SIDEBAR_CONFIG';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const session = JSON.parse(localStorage.getItem('pixel_user') || 'null');

  // Sin sesión → login
  if (!session) {
    return <Navigate to="/login" />;
  }

  const userRole     = session?.rol?.nombre || 'Cliente';
  const allowedPaths = ALLOWED_PATHS_BY_ROLE[userRole];

  // Admin → acceso total
  if (allowedPaths === null) {
    return children;
  }

  // Rol restringido → verificar si la ruta actual está permitida
  const isAllowed =
    location.pathname === '/dashboard' ||
    allowedPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    );

  if (isAllowed) {
    return children;
  }

  // Ruta no permitida → redirige al dashboard
  return <Navigate to="/dashboard" />;
};

export default ProtectedRoute;