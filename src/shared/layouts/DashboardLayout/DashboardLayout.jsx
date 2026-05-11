import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { PATHS } from '../../../routes/paths';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const showHeader = location.pathname === PATHS.DASHBOARD;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        {showHeader && <Header />}
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
