import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';

const lazyNamed = (loader, exportName) => lazy(async () => {
  const module = await loader();
  return { default: module[exportName] };
});

const DashboardLayout = lazy(() => import('../shared/layouts/DashboardLayout/DashboardLayout'));
const LandingPage = lazy(() => import('../modules/landing/pages/LandingPage'));
const PublicQuotePage = lazy(() => import('../modules/landing/pages/PublicQuotePage'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('../modules/auth/pages/ResetPasswordPage'));
const CreateClientPasswordPage = lazy(() => import('../modules/auth/pages/CreateClientPasswordPage'));
const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const RolesPage = lazy(() => import('../modules/configuration/pages/RolesPage'));
const UsersPage = lazyNamed(() => import('../modules/users/pages/UsersPage.jsx'), 'UsersPage');
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
const SalesReturnsPage = lazy(() => import('../modules/sales/pages/SalesReturnsPage'));
const PedidosPage = lazy(() => import('../modules/sales/pages/PedidosPage.jsx'));
const PedidoExpedientePage = lazyNamed(
  () => import('../modules/sales/pedidos/presentation/PedidoExpedientePage'),
  'PedidoExpedientePage',
);
const ProductionPage = lazy(() => import('../modules/production/pages/ProductionPage'));
const DesignsPage = lazy(() => import('../modules/production/pages/DesignsPage'));
const DeliveryPage = lazy(() => import('../modules/production/pages/DeliveryPage'));
const ClientDisenosPage = lazyNamed(
  () => import('../modules/production/disenos/presentation/ClientDisenosPage'),
  'ClientDisenosPage',
);
const ServicesPage = lazy(() => import('../modules/services/pages/ServicesPage'));
const QuotesPage = lazy(() => import('../modules/services/pages/QuotesPage'));
const ProductsPage = lazyNamed(() => import('../modules/products/pages/ProductsPage'), 'ProductsPage');
const ProductCategoriesPage = lazyNamed(
  () => import('../modules/products/pages/ProductCategoriesPage'),
  'ProductCategoriesPage',
);
const TechniqueRatesPage = lazyNamed(
  () => import('../modules/services/tarifas/pages/TechniqueRatesPage'),
  'TechniqueRatesPage',
);
const SettingsPage = lazy(() => import('../modules/settings/pages/SettingsPage'));

const RouteFallback = () => (
  <div role="status" aria-live="polite" aria-label="Cargando pantalla" />
);

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path={PATHS.HOME} element={<LandingPage />} />
          <Route path={PATHS.PUBLIC_QUOTE} element={<PublicQuotePage />} />
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
          <Route path={PATHS.REGISTER} element={<Navigate to={PATHS.LOGIN} replace />} />
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
            <Route path={PATHS.CLIENT_QUOTES} element={<QuotesPage />} />
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
            <Route path={PATHS.SALES_PAYMENTS} element={<Navigate to={PATHS.ORDERS} replace />} />
            <Route path={PATHS.SALES_RETURNS} element={<SalesReturnsPage />} />
            <Route path={PATHS.ORDERS} element={<PedidosPage />} />
            <Route path={PATHS.ORDER_FILE} element={<PedidoExpedientePage />} />
            <Route path={PATHS.PRODUCTION} element={<ProductionPage />} />
            <Route path={PATHS.PRODUCTION_DESIGNS} element={<DesignsPage />} />
            <Route path={PATHS.PRODUCTION_DELIVERY} element={<DeliveryPage />} />
            <Route path={PATHS.SERVICES} element={<ServicesPage />} />
            <Route path={PATHS.SERVICES_QUOTES} element={<QuotesPage />} />
            <Route path={PATHS.SERVICES_PRODUCTS} element={<ProductsPage />} />
            <Route path={PATHS.SERVICES_PRODUCT_CATEGORIES} element={<ProductCategoriesPage />} />
            <Route path={PATHS.SERVICES_TECHNIQUE_RATES} element={<TechniqueRatesPage />} />
            <Route path={PATHS.SETTINGS} element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
