export const PERMISSIONS_STORAGE_KEY = 'pixel_permissions';

export const normalizePermissionCodes = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];

  return [...new Set(
    permissions
      .map((permission) => {
        if (typeof permission === 'string') return permission;
        return permission?.codigo;
      })
      .filter(Boolean)
  )];
};

export const hasPermission = (permissions = [], code) => {
  if (!code) return true;
  return normalizePermissionCodes(permissions).includes(code);
};

export const hasAnyPermission = (permissions = [], codes = []) => {
  if (!Array.isArray(codes) || codes.length === 0) return true;
  const available = normalizePermissionCodes(permissions);
  return codes.some((code) => available.includes(code));
};

export const hasAllPermissions = (permissions = [], codes = []) => {
  if (!Array.isArray(codes) || codes.length === 0) return true;
  const available = normalizePermissionCodes(permissions);
  return codes.every((code) => available.includes(code));
};

export const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const getUserRoleName = (user) =>
  user?.rol?.nombre || user?.nombreRol || user?.role || user?.rol || '';

const CLIENT_ONLY_PERMISSION_CODES = [
  'dashboard.cliente',
  'cotizaciones.cliente.ver',
  'pedidos.cliente.ver',
  'abonos.cliente.ver',
  'disenos.cliente.ver',
  'perfil.ver',
  'perfil.editar',
];

const ADMIN_ROLE_KEYWORDS = ['admin', 'administrador', 'empleado', 'secretaria', 'disenador', 'diseñador'];

export const hasAdministrativeAccess = (permissions = []) => {
  const codes = normalizePermissionCodes(permissions);

  return codes.some((code) => (
    code === 'dashboard.admin' ||
    (!CLIENT_ONLY_PERMISSION_CODES.includes(code) && !code.includes('.cliente.'))
  ));
};

export const isClientUser = (user, permissions = []) => {
  const roleName = normalizeText(getUserRoleName(user));
  const codes = normalizePermissionCodes(permissions);
  const isExplicitAdminRole = ADMIN_ROLE_KEYWORDS.some((keyword) => roleName.includes(keyword));

  if (isExplicitAdminRole) return false;
  if (roleName.includes('cliente')) return true;

  return codes.includes('dashboard.cliente') && !hasAdministrativeAccess(codes);
};
