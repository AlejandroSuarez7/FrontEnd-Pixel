import { useEffect, useMemo, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../core/services/apiService';
import {
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  normalizePermissionCodes,
} from '../core/utils/permissions';
import { authService } from '../modules/auth/services/authService';
import { AuthContext } from './AuthContext';

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

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setPermissions([]);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  const value = useMemo(() => ({
    user,
    permissions,
    loading,
    login: async (email, password) => {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      setPermissions(normalizePermissionCodes(loggedInUser.codigos));
      return loggedInUser;
    },
    register: async (userData) => {
      await authService.register(userData);
    },
    logout: () => {
      authService.logout();
      setUser(null);
      setPermissions([]);
    },
    updateSession: (userData) => {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('pixel_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPermissions(normalizePermissionCodes(updatedUser.codigos || permissions));
    },
    hasPermission: (code) => checkPermission(permissions, code),
    hasAnyPermission: (codes) => checkAnyPermission(permissions, codes),
    hasAllPermissions: (codes) => checkAllPermissions(permissions, codes),
  }), [loading, permissions, user]);

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};
