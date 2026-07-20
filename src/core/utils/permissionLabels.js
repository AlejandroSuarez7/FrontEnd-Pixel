const MODULE_NAMES = {
  categorias_producto: 'Categorías de productos',
  productos: 'Productos cotizables',
  tecnicas: 'Técnicas',
  disenos: 'Diseños',
  cotizaciones: 'Cotizaciones',
  pedidos: 'Pedidos',
  abonos: 'Abonos',
  ventas: 'Ventas',
  compras: 'Compras',
  proveedores: 'Proveedores',
  usuarios: 'Usuarios',
  roles: 'Roles',
  permisos: 'Permisos',
  clientes: 'Clientes',
  dashboard: 'Dashboard',
  general: 'General',
};

const ACTION_NAMES = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  confirmar: 'Confirmar',
  aprobar: 'Aprobar',
  rechazar: 'Rechazar',
  anular: 'Anular',
  finalizar: 'Finalizar',
  pasar_proceso: 'Pasar a proceso',
  produccion: 'Producción',
  precios: 'Gestionar precios de',
  resumen: 'Ver resumen de',
  cliente: 'Gestionar cliente de',
  crear_cliente: 'Crear cotización cliente',
  editar_cliente: 'Editar cotización cliente',
  crear_presencial: 'Crear cotización presencial',
  cotizar: 'Cotizar',
  desactivar: 'Desactivar',
  eliminar: 'Eliminar',
  admin: 'Ver dashboard administrador',
};

const ACTION_ORDER = [
  'ver',
  'crear',
  'editar',
  'confirmar',
  'aprobar',
  'rechazar',
  'anular',
  'finalizar',
  'pasar_proceso',
  'produccion',
  'precios',
  'resumen',
  'cliente',
  'crear_cliente',
  'editar_cliente',
  'crear_presencial',
  'cotizar',
  'desactivar',
  'eliminar',
];

const LABEL_OVERRIDES = {
  'dashboard.admin': 'Ver dashboard administrador',
  'dashboard.cliente': 'Ver dashboard cliente',
  'productos.precios': 'Gestionar precios de productos',
  'disenos.produccion': 'Enviar diseños a producción',
  'cotizaciones.crear_cliente': 'Crear cotizaciones de clientes',
  'cotizaciones.editar_cliente': 'Editar cotizaciones de clientes',
  'cotizaciones.crear_presencial': 'Crear cotizaciones presenciales',
  'cotizaciones.cotizar': 'Cotizar solicitudes',
  'pedidos.pasar_proceso': 'Pasar pedidos a proceso',
  'compras.resumen': 'Ver resumen de compras',
  'ventas.resumen': 'Ver resumen de ventas',
  'perfil.ver': 'Ver perfil',
  'perfil.editar': 'Editar perfil',
};

const pluralToSingular = (value = '') => {
  const text = value.toLowerCase();
  if (text.endsWith('es')) return text.slice(0, -2);
  if (text.endsWith('s')) return text.slice(0, -1);
  return text;
};

const capitalizeWords = (value = '') =>
  value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const formatModuleName = (moduleName = 'general') =>
  MODULE_NAMES[moduleName] || capitalizeWords(moduleName);

export const formatActionName = (action = '') =>
  ACTION_NAMES[action] || capitalizeWords(action);

export const formatPermissionLabel = (code = '', permission = null) => {
  if (LABEL_OVERRIDES[code]) return LABEL_OVERRIDES[code];

  const [moduleFromCode = permission?.modulo || 'general', ...actionParts] = String(code).split('.');
  const moduleName = permission?.modulo || moduleFromCode;
  const action = permission?.accion || actionParts.join('.') || '';
  const actionLabel = formatActionName(action);
  const moduleLabel = formatModuleName(moduleName).toLowerCase();

  if (!action) return formatModuleName(moduleName);
  if (action === 'admin' || action === 'cliente') return `${actionLabel}`;
  if (action === 'precios' || action === 'resumen' || action === 'cliente') return `${actionLabel} ${moduleLabel}`;

  return `${actionLabel} ${moduleLabel}`;
};

export const getPermissionDescription = (permission = {}) => {
  if (permission.descripcion && permission.descripcion !== permission.codigo) return permission.descripcion;
  return permission.codigo;
};

export const sortPermissionsByAction = (permissions = []) =>
  [...permissions].sort((a, b) => {
    const actionA = a.accion || a.codigo?.split('.')?.slice(1).join('.') || '';
    const actionB = b.accion || b.codigo?.split('.')?.slice(1).join('.') || '';
    const indexA = ACTION_ORDER.indexOf(actionA);
    const indexB = ACTION_ORDER.indexOf(actionB);
    const rankA = indexA === -1 ? ACTION_ORDER.length : indexA;
    const rankB = indexB === -1 ? ACTION_ORDER.length : indexB;

    if (rankA !== rankB) return rankA - rankB;
    return formatPermissionLabel(a.codigo, a).localeCompare(formatPermissionLabel(b.codigo, b), 'es');
  });

export const buildPermissionSearchText = (permission = {}) => [
  permission.codigo,
  formatPermissionLabel(permission.codigo, permission),
  formatModuleName(permission.modulo),
  formatActionName(permission.accion),
  getPermissionDescription(permission),
].join(' ').toLowerCase();

export const getPermissionModuleKey = (permission = {}) =>
  permission.modulo || permission.codigo?.split('.')?.[0] || 'general';

export const getPermissionActionRank = (permission = {}) => {
  const action = permission.accion || permission.codigo?.split('.')?.slice(1).join('.') || '';
  const index = ACTION_ORDER.indexOf(action);
  return index === -1 ? ACTION_ORDER.length : index;
};
