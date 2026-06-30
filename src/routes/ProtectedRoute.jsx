import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { canAccessPath, getDefaultProtectedPath } from './SIDEBAR_CONFIG';
import { PATHS } from './paths';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user, permissions, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (canAccessPath(permissions, location.pathname)) {
    return children;
  }

  const fallbackPath = getDefaultProtectedPath(permissions);
  if (fallbackPath && fallbackPath !== location.pathname) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (location.pathname !== PATHS.DASHBOARD) {
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  return (
    <div style={{ padding: '32px', color: '#1a2038' }}>
      No tienes permisos para acceder a esta pantalla.
    </div>
  );
};

export default ProtectedRoute;
