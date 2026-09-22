import { AuthProvider } from './AuthProvider';

export const StoreProvider = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};
