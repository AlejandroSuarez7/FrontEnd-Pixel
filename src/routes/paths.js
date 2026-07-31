export const PATHS = {
  HOME: '/',
  PUBLIC_QUOTE: '/cotizar',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password/:token',
  CREATE_CLIENT_PASSWORD: '/crear-password-cliente/:token',

  DASHBOARD: '/dashboard',
  CLIENT_DESIGNS: '/dashboard/cliente/disenos',
  CLIENT_QUOTES: '/dashboard/cliente/cotizaciones',
  PROFILE: '/dashboard/profile',

  ROLES: '/dashboard/roles',
  USERS: '/dashboard/users',
  USERS_EMPLOYEES: '/dashboard/users/employees',
  USERS_ACCESS: '/dashboard/users/access',
  USERS_CLIENTS: '/dashboard/users/clients',

  PURCHASES: '/dashboard/purchases',
  PURCHASES_PROVIDERS: '/dashboard/purchases/providers',
  PURCHASES_SUPPLIES: '/dashboard/purchases/supplies',
  PURCHASES_CATEGORIES: '/dashboard/purchases/categories',

  SALES: '/dashboard/sales',
  SALES_PRODUCTS: '/dashboard/sales/products',
  SALES_CATEGORIES: '/dashboard/sales/categories',
  SALES_PAYMENTS: '/dashboard/sales/payments',
  SALES_RETURNS: '/dashboard/sales/returns',
  ORDERS: '/dashboard/orders',
  ORDER_FILE: '/dashboard/orders/:idPedido/expediente',

  SERVICES: '/dashboard/services',
  SERVICES_QUOTES: '/dashboard/services/quotes',
  SERVICES_PRODUCTS: '/dashboard/services/products',
  SERVICES_PRODUCT_CATEGORIES: '/dashboard/services/product-categories',
  SERVICES_TECHNIQUE_RATES: '/dashboard/services/technique-rates',

  PRODUCTION: '/dashboard/production',
  PRODUCTION_DESIGNS: '/dashboard/production/designs',
  PRODUCTION_DELIVERY: '/dashboard/production/delivery',

  SETTINGS: '/dashboard/settings',
};
