import { AuthProvider } from './AuthContext';

export const StoreProvider = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};
