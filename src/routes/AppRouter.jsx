import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../shared/layouts/DashboardLayout/DashboardLayout';

import LandingPage from '../modules/landing/pages/LandingPage';

const PublicQuotePage = lazy(() => import('../modules/landing/pages/PublicQuotePage'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('../modules/auth/pages/ResetPasswordPage'));
const CreateClientPasswordPage = lazy(() => import('../modules/auth/pages/CreateClientPasswordPage'));
const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const RolesPage = lazy(() => import('../modules/configuration/pages/RolesPage'));
const UsersPage = lazy(() => import('../modules/users/pages/UsersPage.jsx').then((module) => ({
  default: module.UsersPage,
})));
const EmployeesPage = lazy(() => import('../modules/users/pages/EmployeesPage'));
const AccessPage = lazy(() => import('../modules/users/pages/AccessPage'));
const ClientsPage = lazy(() => import('../modules/users/pages/ClientsPage'));
const ProfilePage = lazy(() => import('../modules/users/pages/ProfilePage'));
const PurchasesPage = lazy(() => import('../modules/purchases/pages/PurchasesPage'));
const ProvidersPage = lazy(() => import('../modules/purchases/pages/ProvidersPage'));
const SuppliesPage = lazy(() => import('../modules/purchases/pages/SuppliesPage'));
const PurchaseCategoriesPage = lazy(() => import('../modules/purchases/pages/PurchaseCategoriesPage'));
const SalesProductsPage = lazy(() => import('../modules/sales/pages/SalesProductsPage'));
const SalesCategoriesPage = lazy(() => import('../modules/sales/pages/SalesCategoriesPage'));
const SalesPaymentsPage = lazy(() => import('../modules/sales/pages/SalesPaymentsPage'));
const SalesReturnsPage = lazy(() => import('../modules/sales/pages/SalesReturnsPage'));
const PedidosPage = lazy(() => import('../modules/sales/pages/PedidosPage.jsx'));
const PedidoExpedientePage = lazy(() => (
  import('../modules/sales/pedidos/presentation/PedidoExpedientePage').then((module) => ({
    default: module.PedidoExpedientePage,
  }))
));
const ProductionPage = lazy(() => import('../modules/production/pages/ProductionPage'));
const DesignsPage = lazy(() => import('../modules/production/pages/DesignsPage'));
const DeliveryPage = lazy(() => import('../modules/production/pages/DeliveryPage'));
const ClientDisenosPage = lazy(() => (
  import('../modules/production/disenos/presentation/ClientDisenosPage').then((module) => ({
    default: module.ClientDisenosPage,
  }))
));
const ServicesPage = lazy(() => import('../modules/services/pages/ServicesPage'));
const QuotesPage = lazy(() => import('../modules/services/pages/QuotesPage'));
const ProductsPage = lazy(() => import('../modules/products/pages/ProductsPage').then((module) => ({
  default: module.ProductsPage,
})));
const ProductCategoriesPage = lazy(() => (
  import('../modules/products/pages/ProductCategoriesPage').then((module) => ({
    default: module.ProductCategoriesPage,
  }))
));
const TechniqueRatesPage = lazy(() => (
  import('../modules/services/tarifas/pages/TechniqueRatesPage').then((module) => ({
    default: module.TechniqueRatesPage,
  }))
));
const SettingsPage = lazy(() => import('../modules/settings/pages/SettingsPage'));

const LazyRoute = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path={PATHS.HOME} element={<LandingPage />} />
        <Route path={PATHS.PUBLIC_QUOTE} element={<LazyRoute><PublicQuotePage /></LazyRoute>} />
        <Route path={PATHS.LOGIN} element={<LazyRoute><LoginPage /></LazyRoute>} />
        <Route path={PATHS.REGISTER} element={<Navigate to={PATHS.LOGIN} replace />} />
        <Route path={PATHS.RESET_PASSWORD} element={<LazyRoute><ResetPasswordPage /></LazyRoute>} />
        <Route path={PATHS.CREATE_CLIENT_PASSWORD} element={<LazyRoute><CreateClientPasswordPage /></LazyRoute>} />

        {/* Protected Routes */}
        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LazyRoute><DashboardPage /></LazyRoute>} />
          <Route path={PATHS.CLIENT_DESIGNS} element={<LazyRoute><ClientDisenosPage /></LazyRoute>} />
          <Route path={PATHS.CLIENT_QUOTES} element={<LazyRoute><QuotesPage /></LazyRoute>} />
          <Route path={PATHS.ROLES} element={<LazyRoute><RolesPage /></LazyRoute>} />
          <Route path={PATHS.USERS} element={<LazyRoute><UsersPage /></LazyRoute>} />
          <Route path={PATHS.USERS_EMPLOYEES} element={<LazyRoute><EmployeesPage /></LazyRoute>} />
          <Route path={PATHS.USERS_ACCESS} element={<LazyRoute><AccessPage /></LazyRoute>} />
          <Route path={PATHS.USERS_CLIENTS} element={<LazyRoute><ClientsPage /></LazyRoute>} />
          <Route path={PATHS.PROFILE} element={<LazyRoute><ProfilePage /></LazyRoute>} />
          <Route path={PATHS.PURCHASES} element={<LazyRoute><PurchasesPage /></LazyRoute>} />
          <Route path={PATHS.PURCHASES_PROVIDERS} element={<LazyRoute><ProvidersPage /></LazyRoute>} />
          <Route path={PATHS.PURCHASES_SUPPLIES} element={<LazyRoute><SuppliesPage /></LazyRoute>} />
          <Route path={PATHS.PURCHASES_CATEGORIES} element={<LazyRoute><PurchaseCategoriesPage /></LazyRoute>} />
          <Route path={PATHS.SALES} element={<LazyRoute><SalesProductsPage /></LazyRoute>} />
          <Route path={PATHS.SALES_PRODUCTS} element={<LazyRoute><SalesProductsPage /></LazyRoute>} />
          <Route path={PATHS.SALES_CATEGORIES} element={<LazyRoute><SalesCategoriesPage /></LazyRoute>} />
          <Route path={PATHS.SALES_PAYMENTS} element={<LazyRoute><SalesPaymentsPage /></LazyRoute>} />
          <Route path={PATHS.SALES_RETURNS} element={<LazyRoute><SalesReturnsPage /></LazyRoute>} />
          <Route path={PATHS.ORDERS} element={<LazyRoute><PedidosPage /></LazyRoute>} />
          <Route path={PATHS.ORDER_FILE} element={<LazyRoute><PedidoExpedientePage /></LazyRoute>} />
          <Route path={PATHS.PRODUCTION} element={<LazyRoute><ProductionPage /></LazyRoute>} />
          <Route path={PATHS.PRODUCTION_DESIGNS} element={<LazyRoute><DesignsPage /></LazyRoute>} />
          <Route path={PATHS.PRODUCTION_DELIVERY} element={<LazyRoute><DeliveryPage /></LazyRoute>} />
          <Route path={PATHS.SERVICES} element={<LazyRoute><ServicesPage /></LazyRoute>} />
          <Route path={PATHS.SERVICES_QUOTES} element={<LazyRoute><QuotesPage /></LazyRoute>} />
          <Route path={PATHS.SERVICES_PRODUCTS} element={<LazyRoute><ProductsPage /></LazyRoute>} />
          <Route path={PATHS.SERVICES_PRODUCT_CATEGORIES} element={<LazyRoute><ProductCategoriesPage /></LazyRoute>} />
          <Route path={PATHS.SERVICES_TECHNIQUE_RATES} element={<LazyRoute><TechniqueRatesPage /></LazyRoute>} />
          <Route path={PATHS.SETTINGS} element={<LazyRoute><SettingsPage /></LazyRoute>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
