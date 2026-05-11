import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../store/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h2>Dashboard</h2>
        <div className="user-section">
          <span>{user?.email}</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
