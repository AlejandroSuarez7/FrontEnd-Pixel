import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../modules/auth/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true mientras verifica sesión guardada

  // Al montar, restaura la sesión si hay token guardado
  useEffect(() => {
    const session = authService.getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
  };

  const register = async (userData) => {
    await authService.register(userData);
    // Después del registro redirige al login — no logueamos automáticamente
    // Si tu API devuelve token en signup, llama a login() aquí directamente
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook de conveniencia — úsalo en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};