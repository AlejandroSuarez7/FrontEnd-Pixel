import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../shared/layouts/DashboardLayout/DashboardLayout';

const ProtectedDashboardLayout = () => (
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
);

export default ProtectedDashboardLayout;
