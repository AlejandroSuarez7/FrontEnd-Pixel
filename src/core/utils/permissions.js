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
