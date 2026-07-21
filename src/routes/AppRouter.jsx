import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../shared/layouts/DashboardLayout/DashboardLayout';

// Pages
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';
import CreateClientPasswordPage from '../modules/auth/pages/CreateClientPasswordPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import RolesPage from '../modules/configuration/pages/RolesPage';
import { UsersPage } from '../modules/users/pages/UsersPage.jsx';
import EmployeesPage from '../modules/users/pages/EmployeesPage';
import AccessPage from '../modules/users/pages/AccessPage';
import ClientsPage from '../modules/users/pages/ClientsPage';
import ProfilePage from '../modules/users/pages/ProfilePage';
import PurchasesPage from '../modules/purchases/pages/PurchasesPage';
import ProvidersPage from '../modules/purchases/pages/ProvidersPage';
import SuppliesPage from '../modules/purchases/pages/SuppliesPage';
import PurchaseCategoriesPage from '../modules/purchases/pages/PurchaseCategoriesPage';
import SalesProductsPage from '../modules/sales/pages/SalesProductsPage';
import SalesCategoriesPage from '../modules/sales/pages/SalesCategoriesPage';
import SalesPaymentsPage from '../modules/sales/pages/SalesPaymentsPage';
import SalesReturnsPage from '../modules/sales/pages/SalesReturnsPage';
import PedidosPage from '../modules/sales/pages/PedidosPage.jsx';
import ProductionPage from '../modules/production/pages/ProductionPage';
import DesignsPage from '../modules/production/pages/DesignsPage';
import DeliveryPage from '../modules/production/pages/DeliveryPage';
import { ClientDisenosPage } from '../modules/production/disenos/presentation/ClientDisenosPage';
import ServicesPage from '../modules/services/pages/ServicesPage';
import QuotesPage from '../modules/services/pages/QuotesPage';
import { ProductsPage } from '../modules/products/pages/ProductsPage';
import { ProductCategoriesPage } from '../modules/products/pages/ProductCategoriesPage';
import SettingsPage from '../modules/settings/pages/SettingsPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path={PATHS.HOME} element={<LandingPage />} />
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.REGISTER} element={<RegisterPage />} />
        <Route path={PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={PATHS.CREATE_CLIENT_PASSWORD} element={<CreateClientPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path={PATHS.CLIENT_DESIGNS} element={<ClientDisenosPage />} />
          <Route path={PATHS.ROLES} element={<RolesPage />} />
          <Route path={PATHS.USERS} element={<UsersPage />} />
          <Route path={PATHS.USERS_EMPLOYEES} element={<EmployeesPage />} />
          <Route path={PATHS.USERS_ACCESS} element={<AccessPage />} />
          <Route path={PATHS.USERS_CLIENTS} element={<ClientsPage />} />
          <Route path={PATHS.PROFILE} element={<ProfilePage />} />
          <Route path={PATHS.PURCHASES} element={<PurchasesPage />} />
          <Route path={PATHS.PURCHASES_PROVIDERS} element={<ProvidersPage />} />
          <Route path={PATHS.PURCHASES_SUPPLIES} element={<SuppliesPage />} />
          <Route path={PATHS.PURCHASES_CATEGORIES} element={<PurchaseCategoriesPage />} />
          <Route path={PATHS.SALES} element={<SalesProductsPage />} />
          <Route path={PATHS.SALES_PRODUCTS} element={<SalesProductsPage />} />
          <Route path={PATHS.SALES_CATEGORIES} element={<SalesCategoriesPage />} />
          <Route path={PATHS.SALES_PAYMENTS} element={<SalesPaymentsPage />} />
          <Route path={PATHS.SALES_RETURNS} element={<SalesReturnsPage />} />
          <Route path={PATHS.ORDERS} element={<PedidosPage />}/>
          <Route path={PATHS.PRODUCTION} element={<ProductionPage />} />
          <Route path={PATHS.PRODUCTION_DESIGNS} element={<DesignsPage />} />
          <Route path={PATHS.PRODUCTION_DELIVERY} element={<DeliveryPage />} />
          <Route path={PATHS.SERVICES} element={<ServicesPage />} />
          <Route path={PATHS.SERVICES_QUOTES} element={<QuotesPage />} />
          <Route path={PATHS.SERVICES_PRODUCTS} element={<ProductsPage />} />
          <Route path={PATHS.SERVICES_PRODUCT_CATEGORIES} element={<ProductCategoriesPage />} />
          <Route path={PATHS.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
