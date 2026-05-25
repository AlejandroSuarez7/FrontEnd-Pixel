import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {

  const session = JSON.parse(
    localStorage.getItem('pixel_user')
  );

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;