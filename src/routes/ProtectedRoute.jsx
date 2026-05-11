import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {

  const session = JSON.parse(
    localStorage.getItem('pixel_session')
  );

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;