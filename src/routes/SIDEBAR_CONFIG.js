import { PATHS } from './paths';

export const SIDEBAR_BY_ROLE = {
  Admin: [
    { label: 'Inicio', icon: 'home', to: PATHS.HOME },
    { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD },
    {
      label: 'Configuracion',
      icon: 'settings',
      key: 'config',
      items: [
        { label: 'Gestion de Roles', to: PATHS.ROLES },
      ],
    },
    {
      label: 'Usuarios',
      icon: 'groups',
      key: 'users',
      items: [
        { label: 'Gestion de Usuarios', to: PATHS.USERS },
      ],
    },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      key: 'purchases',
      items: [
        { label: 'Compras', to: PATHS.PURCHASES },
        { label: 'Proveedores', to: PATHS.PURCHASES_PROVIDERS },
      ],
    },
    {
      label: 'Ventas',
      icon: 'sell',
      key: 'sales',
      items: [
        { label: 'Gestion de Ventas', to: PATHS.SALES },
        { label: 'Gestion de Abonos', to: PATHS.SALES_PAYMENTS },
        { label: 'Gestion de Pedidos', to: PATHS.ORDERS },
      ],
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Gestion de Servicios', to: PATHS.SERVICES },
        { label: 'Gestion de Cotizaciones', to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Produccion',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Cola de Produccion', to: PATHS.PRODUCTION },
        { label: 'Gestion de Disenos', to: PATHS.PRODUCTION_DESIGNS },
      ],
    },
  ],

  Secretaria: [
    { label: 'Inicio', icon: 'home', to: PATHS.HOME },
    { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      key: 'purchases',
      items: [
        { label: 'Compras', to: PATHS.PURCHASES },
        { label: 'Proveedores', to: PATHS.PURCHASES_PROVIDERS },
      ],
    },
    {
      label: 'Ventas',
      icon: 'sell',
      key: 'sales',
      items: [
        { label: 'Gestion de Ventas', to: PATHS.SALES },
        { label: 'Gestion de Abonos', to: PATHS.SALES_PAYMENTS },
        { label: 'Gestion de Pedidos', to: PATHS.ORDERS },
      ],
    },
    {
      label: 'Servicios',
      icon: 'build',
      key: 'services',
      items: [
        { label: 'Gestion de Servicios', to: PATHS.SERVICES },
        { label: 'Gestion de Cotizaciones', to: PATHS.SERVICES_QUOTES },
      ],
    },
    {
      label: 'Produccion',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Cola de Produccion', to: PATHS.PRODUCTION },
        { label: 'Gestion de Disenos', to: PATHS.PRODUCTION_DESIGNS },
      ],
    },
  ],

  Cliente: [
    { label: 'Inicio', icon: 'home', to: PATHS.HOME },
    { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD },
    { label: 'Mi Perfil', icon: 'account_circle', to: PATHS.PROFILE },
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
        { label: 'Mis Abonos', to: PATHS.SALES_PAYMENTS },
        { label: 'Mis Disenos', to: PATHS.PRODUCTION_DESIGNS },
      ],
    },
  ],

  Disenador: [
    { label: 'Inicio', icon: 'home', to: PATHS.HOME },
    { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD },
    { label: 'Compras', icon: 'shopping_cart', to: PATHS.PURCHASES },
    {
      label: 'Produccion',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Gestion de Disenos', to: PATHS.PRODUCTION_DESIGNS },
        { label: 'Cola de Produccion', to: PATHS.PRODUCTION },
      ],
    },
  ],

  Diseñador: [
    { label: 'Dashboard', icon: 'dashboard', to: PATHS.DASHBOARD },
    { label: 'Compras', icon: 'shopping_cart', to: PATHS.PURCHASES },
    {
      label: 'Produccion',
      icon: 'engineering',
      key: 'production',
      items: [
        { label: 'Gestion de Disenos', to: PATHS.PRODUCTION_DESIGNS },
        { label: 'Cola de Produccion', to: PATHS.PRODUCTION },
      ],
    },
  ],
};

export const ALLOWED_PATHS_BY_ROLE = {
  Admin: null,
  Secretaria: [
    PATHS.DASHBOARD,
    PATHS.PURCHASES, PATHS.PURCHASES_PROVIDERS,
    PATHS.SALES, PATHS.SALES_PAYMENTS, PATHS.ORDERS,
    PATHS.SERVICES, PATHS.SERVICES_QUOTES,
    PATHS.PRODUCTION, PATHS.PRODUCTION_DESIGNS,
  ],
  Cliente: [
    PATHS.DASHBOARD,
    PATHS.PROFILE,
    PATHS.SERVICES_QUOTES,
    PATHS.ORDERS,
    PATHS.SALES_PAYMENTS,
    PATHS.PRODUCTION_DESIGNS,
  ],
  Disenador: [
    PATHS.DASHBOARD,
    PATHS.PURCHASES,
    PATHS.PRODUCTION,
    PATHS.PRODUCTION_DESIGNS,
  ],
  Diseñador: [
    PATHS.DASHBOARD,
    PATHS.PURCHASES,
    PATHS.PRODUCTION,
    PATHS.PRODUCTION_DESIGNS,
  ],
};
