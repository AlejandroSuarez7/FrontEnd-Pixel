import { hasAnyPermission, isClientUser } from '../core/utils/permissions';
import { LANDING_QUOTE_PATH } from '../core/utils/landingNavigation';
import { PATHS } from './paths';

export const ROUTE_PERMISSIONS = {
  [PATHS.DASHBOARD]: ['dashboard.admin', 'dashboard.cliente'],
  [PATHS.CLIENT_DESIGNS]: ['disenos.cliente.ver'],
  [PATHS.ROLES]: ['roles.ver'],
  [PATHS.USERS]: ['usuarios.ver'],
  [PATHS.USERS_EMPLOYEES]: ['usuarios.ver'],
  [PATHS.USERS_ACCESS]: ['usuarios.ver'],
  [PATHS.USERS_CLIENTS]: ['clientes.ver'],
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
  [PATHS.SERVICES_PRODUCTS]: ['productos.ver'],
  [PATHS.SERVICES_PRODUCT_CATEGORIES]: ['categorias_producto.ver'],
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
      { label: 'Clientes', to: PATHS.USERS_CLIENTS, permissions: ROUTE_PERMISSIONS[PATHS.USERS_CLIENTS] },
    ],
  },
  {
    label: 'Catalogo',
    icon: 'inventory_2',
    key: 'catalog',
    items: [
      { label: 'Categorias de productos', to: PATHS.SERVICES_PRODUCT_CATEGORIES, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES_PRODUCT_CATEGORIES] },
      { label: 'Productos cotizables', to: PATHS.SERVICES_PRODUCTS, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES_PRODUCTS] },
      { label: 'Gestion de Tecnicas', to: PATHS.SERVICES, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES] },
    ],
  },
  {
    label: 'Ventas',
    icon: 'sell',
    key: 'sales',
    items: [
      { label: 'Gestion de Cotizaciones', to: PATHS.SERVICES_QUOTES, permissions: ROUTE_PERMISSIONS[PATHS.SERVICES_QUOTES] },
      { label: 'Gestion de Pedidos', to: PATHS.ORDERS, permissions: ROUTE_PERMISSIONS[PATHS.ORDERS] },
      { label: 'Gestion de Abonos', to: PATHS.SALES_PAYMENTS, permissions: ROUTE_PERMISSIONS[PATHS.SALES_PAYMENTS] },
      { label: 'Gestion de Ventas', to: PATHS.SALES, permissions: ROUTE_PERMISSIONS[PATHS.SALES] },
    ],
  },
  {
    label: 'Compras',
    icon: 'shopping_cart',
    key: 'purchases',
    items: [
      { label: 'Proveedores', to: PATHS.PURCHASES_PROVIDERS, permissions: ROUTE_PERMISSIONS[PATHS.PURCHASES_PROVIDERS] },
      { label: 'Compras', to: PATHS.PURCHASES, permissions: ROUTE_PERMISSIONS[PATHS.PURCHASES] },
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

export const canAccessPath = (permissions, pathname, user = null) => {
  if (pathname === PATHS.HOME || pathname === PATHS.PROFILE) return true;

  if (isClientUser(user, permissions)) {
    if (pathname === PATHS.DASHBOARD) return true;
    return hasAnyPermission(permissions, ROUTE_PERMISSIONS[pathname] || []);
  }

  const matchedPath = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!matchedPath) return false;
  return hasAnyPermission(permissions, ROUTE_PERMISSIONS[matchedPath]);
};

export const getDefaultProtectedPath = (permissions, user = null) => {
  if (isClientUser(user, permissions)) return PATHS.DASHBOARD;

  const preferredPaths = [
    PATHS.DASHBOARD,
    PATHS.ROLES,
    PATHS.USERS,
    PATHS.USERS_CLIENTS,
    PATHS.SERVICES_PRODUCT_CATEGORIES,
    PATHS.SERVICES_PRODUCTS,
    PATHS.SERVICES,
    PATHS.SERVICES_QUOTES,
    PATHS.ORDERS,
    PATHS.SALES_PAYMENTS,
    PATHS.SALES,
    PATHS.PURCHASES_PROVIDERS,
    PATHS.PURCHASES,
    PATHS.PRODUCTION,
    PATHS.PRODUCTION_DESIGNS,
    PATHS.PROFILE,
  ];

  return preferredPaths.find((path) => canAccessPath(permissions, path, user)) || null;
};

export const filterSidebarByPermissions = (permissions, user = null) => {
  if (isClientUser(user, permissions)) {
    return [
      { label: 'Inicio', icon: 'home', to: PATHS.HOME },
      { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD, permissions: ROUTE_PERMISSIONS[PATHS.DASHBOARD] },
      { label: 'Mis pedidos', icon: 'dashboard', to: `${PATHS.DASHBOARD}#pedidos`, permissions: ROUTE_PERMISSIONS[PATHS.DASHBOARD] },
      { label: 'Mis disenos', icon: 'image', to: PATHS.CLIENT_DESIGNS, permissions: ROUTE_PERMISSIONS[PATHS.CLIENT_DESIGNS] },
      { label: 'Crear cotizacion', icon: 'add_circle', to: LANDING_QUOTE_PATH },
      { label: 'Mi Perfil', icon: 'account_circle', to: PATHS.PROFILE },
    ].filter((item) => !item.permissions || hasAnyPermission(permissions, item.permissions));
  }

  return SIDEBAR_ITEMS
    .map((section) => {
      if (section.items) {
        const items = section.items.filter((item) => hasAnyPermission(permissions, item.permissions));
        return items.length > 0 ? { ...section, items } : null;
      }

      return hasAnyPermission(permissions, section.permissions) ? section : null;
    })
    .filter(Boolean);
};

export const SIDEBAR_BY_ROLE = {};
export const ALLOWED_PATHS_BY_ROLE = {};
