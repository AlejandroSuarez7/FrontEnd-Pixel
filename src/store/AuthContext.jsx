import { createContext, useEffect, useState } from 'react';
import { authService } from '../modules/auth/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = authService.getSession();

    if (session) {
      setUser(session);
    }
  }, []);

  const login = (email, password) => {
    try {
      const loggedInUser = authService.login(email, password);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};