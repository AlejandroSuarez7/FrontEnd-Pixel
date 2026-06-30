import { hasAnyPermission } from '../core/utils/permissions';
import { PATHS } from './paths';

export const ROUTE_PERMISSIONS = {
  [PATHS.DASHBOARD]: ['dashboard.admin', 'dashboard.cliente'],
  [PATHS.ROLES]: ['roles.ver'],
  [PATHS.USERS]: ['usuarios.ver'],
  [PATHS.USERS_EMPLOYEES]: ['usuarios.ver'],
  [PATHS.USERS_ACCESS]: ['usuarios.ver'],
  [PATHS.USERS_CLIENTS]: ['usuarios.ver'],
  [PATHS.PROFILE]: [],
  [PATHS.PURCHASES]: ['compras.ver'],
  [PATHS.PURCHASES_PROVIDERS]: ['proveedores.ver'],
  [PATHS.PURCHASES_SUPPLIES]: ['compras.ver'],
  [PATHS.PURCHASES_CATEGORIES]: ['compras.ver'],
  [PATHS.SALES]: ['ventas.ver', 'ventas.resumen'],
  [PATHS.SALES_PRODUCTS]: ['ventas.ver'],
  [PATHS.SALES_CATEGORIES]: ['ventas.ver'],
  [PATHS.SALES_PAYMENTS]: ['abonos.ver'],
  [PATHS.SALES_RETURNS]: ['ventas.ver'],
  [PATHS.ORDERS]: ['pedidos.ver'],
  [PATHS.PRODUCTION]: ['pedidos.ver', 'disenos.produccion'],
  [PATHS.PRODUCTION_DESIGNS]: ['disenos.ver'],
  [PATHS.PRODUCTION_DELIVERY]: ['pedidos.ver'],
  [PATHS.SERVICES]: ['tecnicas.ver'],
  [PATHS.SERVICES_QUOTES]: ['cotizaciones.ver'],
  [PATHS.SETTINGS]: ['roles.ver', 'usuarios.ver', 'permisos.ver'],
};

export const SIDEBAR_ITEMS = [
  { label: 'Inicio', icon: 'home', to: PATHS.HOME },
  { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD, permissions: ROUTE_PERMISSIONS[PATHS.DASHBOARD] },
  {
    label: 'Configuracion',
    icon: 'settings',
    key: 'config',
    items: [
      { label: 'Gestion de Roles', to: PATHS.ROLES, permissions: ROUTE_PERMISSIONS[PATHS.ROLES] },
    ],
  },
  {
    label: 'Usuarios',
    icon: 'groups',
    key: 'users',
    items: [
      { label: 'Gestion de Usuarios', to: PATHS.USERS, permissions: ROUTE_PERMISSIONS[PATHS.USERS] },
    ],
  },
  {
    label: 'Compras',
    icon: 'shopping_cart',
    key: 'purchases',
    items: [
      { label: 'Compras', to: PATHS.PURCHASES, permissions: ROUTE_PERMISSIONS[PATHS.PURCHASES] },
      { label: 'Proveedores', to: PATHS.PURCHASES_PROVIDERS, permissions: ROUTE_PERMISSIONS[PATHS.PURCHASES_PROVIDERS] },
    ],
  },
  {
    label: 'Ventas',
    icon: 'sell',
    key: 'sales',
    items: [
      { label: 'Gestion de Ventas', to: PATHS.SALES, permissions: ROUTE_PERMISSIONS[PATHS.SALES] },
      { label: 'Gestion de Abonos', to: PATHS.SALES_PAYMENTS, permissions: ROUTE_PERMISSIONS[PATHS.SALES_PAYMENTS] },
      { label: 'Gestion de Pedidos', to: PATHS.ORDERS, permissions: ROUTE_PERMISSIONS[PATHS.ORDERS] },
    ],
  },
  {
    label: 'Servicios',
    icon: 'build',
    key: 'services',
    items: [
      { label: 'Gestion de Servicios', to: PATHS.SERVICES, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES] },
      { label: 'Gestion de Cotizaciones', to: PATHS.SERVICES_QUOTES, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES_QUOTES] },
    ],
  },
  {
    label: 'Produccion',
    icon: 'engineering',
    key: 'production',
    items: [
      { label: 'Cola de Produccion', to: PATHS.PRODUCTION, permissions: ROUTE_PERMISSIONS[PATHS.PRODUCTION] },
      { label: 'Gestion de Disenos', to: PATHS.PRODUCTION_DESIGNS, permissions: ROUTE_PERMISSIONS[PATHS.PRODUCTION_DESIGNS] },
    ],
  },
  { label: 'Mi Perfil', icon: 'account_circle', to: PATHS.PROFILE },
];

export const canAccessPath = (permissions, pathname) => {
  if (pathname === PATHS.HOME || pathname === PATHS.PROFILE) return true;

  const matchedPath = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!matchedPath) return false;
  return hasAnyPermission(permissions, ROUTE_PERMISSIONS[matchedPath]);
};

export const getDefaultProtectedPath = (permissions) => {
  const preferredPaths = [
    PATHS.DASHBOARD,
    PATHS.ROLES,
    PATHS.USERS,
    PATHS.PURCHASES,
    PATHS.PURCHASES_PROVIDERS,
    PATHS.SALES,
    PATHS.SALES_PAYMENTS,
    PATHS.ORDERS,
    PATHS.SERVICES,
    PATHS.SERVICES_QUOTES,
    PATHS.PRODUCTION,
    PATHS.PRODUCTION_DESIGNS,
    PATHS.PROFILE,
  ];

  return preferredPaths.find((path) => canAccessPath(permissions, path)) || null;
};

export const filterSidebarByPermissions = (permissions) => (
  SIDEBAR_ITEMS
    .map((section) => {
      if (section.items) {
        const items = section.items.filter((item) => hasAnyPermission(permissions, item.permissions));
        return items.length > 0 ? { ...section, items } : null;
      }

      return hasAnyPermission(permissions, section.permissions) ? section : null;
    })
    .filter(Boolean)
);

export const SIDEBAR_BY_ROLE = {};
export const ALLOWED_PATHS_BY_ROLE = {};
