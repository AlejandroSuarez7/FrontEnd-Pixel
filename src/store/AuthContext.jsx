import { createContext, useContext, useEffect, useState } from 'react';
import {
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  normalizePermissionCodes,
} from '../core/utils/permissions';
import { authService } from '../modules/auth/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const session = authService.getSession();
      if (!session) {
        if (isMounted) setLoading(false);
        return;
      }

      const restoredPermissions = normalizePermissionCodes(session.codigos);
      if (isMounted) {
        setUser(session);
        setPermissions(restoredPermissions);
      }

      if (authService.getToken()) {
        try {
          const permissionsSession = await authService.fetchPermissions();
          const refreshedUser = {
            ...session,
            permisos: permissionsSession.permisos,
            codigos: permissionsSession.codigos,
          };

          localStorage.setItem('pixel_user', JSON.stringify(refreshedUser));

          if (isMounted) {
            setUser(refreshedUser);
            setPermissions(permissionsSession.codigos);
          }
        } catch (error) {
          console.error('No se pudieron refrescar los permisos de sesion:', error);
        }
      }

      if (isMounted) setLoading(false);
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    setPermissions(normalizePermissionCodes(loggedInUser.codigos));
  };

  const register = async (userData) => {
    await authService.register(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPermissions([]);
  };

  const updateSession = (userData) => {
    const updatedUser = { ...(user || {}), ...userData };
    localStorage.setItem('pixel_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setPermissions(normalizePermissionCodes(updatedUser.codigos || permissions));
  };

  const hasPermission = (code) => checkPermission(permissions, code);
  const hasAnyPermission = (codes) => checkAnyPermission(permissions, codes);
  const hasAllPermissions = (codes) => checkAllPermissions(permissions, codes);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        login,
        register,
        logout,
        updateSession,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
