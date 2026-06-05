// routes/SIDEBAR_CONFIG.js
// Define exactamente qué ve cada rol en el sidebar.
// Cualquier ruta que no esté aquí para un rol será bloqueada por ProtectedRoute.
import { PATHS } from './paths';

export const SIDEBAR_BY_ROLE = {

  // ── ADMIN: acceso completo ──────────────────────────────────────────────
  Admin: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      to: PATHS.DASHBOARD,
    },
    {
      label: 'Configuración',
      icon: 'settings',
      key: 'config',
      items: [
        { label: 'Gestión de Roles', to: PATHS.ROLES },
      ],
    },
    {
      label: 'Usuarios',
      icon: 'groups',
      key: 'users',
      items: [
        { label: 'Gestión de Usuarios', to: PATHS.USERS },
      ],
    },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      key: 'purchases',
      items: [
        { label: 'Gestión de Compras',    to: PATHS.PURCHASES },
        { label: 'Gestión de Proveedores', to: PATHS.PURCHASES_PROVIDERS },
        { label: 'Gestión de Insumos',    to: PATHS.PURCHASES_SUPPLIES },
        { label: 'Categoría Insumos',     to: PATHS.PURCHASES_CATEGORIES },
      ],
    },
    {
      label: 'Ventas',
      icon: 'sell',
      key: 'sales',
      items: [
        { label: 'Gestión de Productos',    to: PATHS.SALES_PRODUCTS },
        { label: 'Categoría de Productos',  to: PATHS.SALES_CATEGORIES },
        { label: 'Gestión de Abonos',       to: PATHS.SALES_PAYMENTS },
        { label: 'Gestión de Devoluciones', to: PATHS.SALES_RETURNS },
        { label: 'Gestión de Pedidos',      to: PATHS.ORDERS },
      ],
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Gestión de Servicios',     to: PATHS.SERVICES },
        { label: 'Gestión de Cotizaciones',  to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Producción',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Cola de Producción',          to: PATHS.PRODUCTION },
        { label: 'Gestión de Diseños',          to: PATHS.PRODUCTION_DESIGNS },
        { label: 'Entrega de Productos',        to: PATHS.PRODUCTION_DELIVERY },
      ],
    },
  ],

  // ── SECRETARIA: igual que Admin pero sin Configuración ni Usuarios ──────
  Secretaria: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      to: PATHS.DASHBOARD,
    },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      key: 'purchases',
      items: [
        { label: 'Gestión de Compras',    to: PATHS.PURCHASES },
        { label: 'Gestión de Proveedores', to: PATHS.PURCHASES_PROVIDERS },
        { label: 'Gestión de Insumos',    to: PATHS.PURCHASES_SUPPLIES },
        { label: 'Categoría Insumos',     to: PATHS.PURCHASES_CATEGORIES },
      ],
    },
    {
      label: 'Ventas',
      icon: 'sell',
      key: 'sales',
      items: [
        { label: 'Gestión de Productos',    to: PATHS.SALES_PRODUCTS },
        { label: 'Categoría de Productos',  to: PATHS.SALES_CATEGORIES },
        { label: 'Gestión de Abonos',       to: PATHS.SALES_PAYMENTS },
        { label: 'Gestión de Devoluciones', to: PATHS.SALES_RETURNS },
        { label: 'Gestión de Pedidos',      to: PATHS.ORDERS },
      ],
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Gestión de Servicios',    to: PATHS.SERVICES },
        { label: 'Gestión de Cotizaciones', to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Producción',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Cola de Producción',   to: PATHS.PRODUCTION },
        { label: 'Gestión de Diseños',   to: PATHS.PRODUCTION_DESIGNS },
        { label: 'Entrega de Productos', to: PATHS.PRODUCTION_DELIVERY },
      ],
    },
  ],

  // ── CLIENTE: solo cotizaciones y pedidos propios ─────────────────────────
  Cliente: [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      to: PATHS.DASHBOARD,
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Mis Cotizaciones', to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Mis Pedidos',
      icon: 'inventory_2',
      key: 'orders',
      items: [
        { label: 'Estado de mis pedidos', to: PATHS.ORDERS },
      ],
    },
  ],
};

// Todas las rutas permitidas por rol — usadas por ProtectedRoute para bloquear acceso directo por URL
export const ALLOWED_PATHS_BY_ROLE = {
  Admin: null, // null = acceso total, no se restringe
  Secretaria: [
    PATHS.DASHBOARD,
    PATHS.PURCHASES, PATHS.PURCHASES_PROVIDERS, PATHS.PURCHASES_SUPPLIES, PATHS.PURCHASES_CATEGORIES,
    PATHS.SALES_PRODUCTS, PATHS.SALES_CATEGORIES, PATHS.SALES_PAYMENTS, PATHS.SALES_RETURNS, PATHS.ORDERS,
    PATHS.SERVICES, PATHS.SERVICES_QUOTES,
    PATHS.PRODUCTION, PATHS.PRODUCTION_DESIGNS, PATHS.PRODUCTION_DELIVERY,
  ],
  Cliente: [
    PATHS.DASHBOARD,
    PATHS.SERVICES_QUOTES,
    PATHS.ORDERS,
  ],
};