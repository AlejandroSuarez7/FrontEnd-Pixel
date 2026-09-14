import { describe, expect, it } from 'vitest';
import {
  canAccessPath,
  filterSidebarByPermissions,
  getDefaultProtectedPath,
  ROUTE_PERMISSIONS,
} from '../../routes/SIDEBAR_CONFIG';
import { PATHS } from '../../routes/paths';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isClientUser,
  normalizePermissionCodes,
} from './permissions';

describe('permission helpers', () => {
  it('normalizes permission objects and strings without duplicates', () => {
    expect(normalizePermissionCodes([
      'ventas.ver',
      { codigo: 'roles.ver' },
      { codigo: 'ventas.ver' },
      null,
    ])).toEqual(['ventas.ver', 'roles.ver']);
  });

  it('checks single, any and all permissions', () => {
    const permissions = ['roles.ver', 'usuarios.ver', 'ventas.ver'];

    expect(hasPermission(permissions, 'roles.ver')).toBe(true);
    expect(hasPermission(permissions, 'compras.ver')).toBe(false);
    expect(hasAnyPermission(permissions, ['compras.ver', 'ventas.ver'])).toBe(true);
    expect(hasAllPermissions(permissions, ['roles.ver', 'usuarios.ver'])).toBe(true);
    expect(hasAllPermissions(permissions, ['roles.ver', 'compras.ver'])).toBe(false);
  });

  it('keeps admin users in the admin experience even if dashboard.cliente exists', () => {
    const user = { rol: { nombre: 'Admin' } };
    const permissions = ['dashboard.admin', 'dashboard.cliente', 'usuarios.ver'];

    expect(isClientUser(user, permissions)).toBe(false);
    expect(getDefaultProtectedPath(permissions, user)).toBe('/dashboard');
  });

  it('returns only client sidebar options for client users', () => {
    const user = { rol: { nombre: 'Cliente' } };
    const permissions = [
      'dashboard.cliente',
      'pedidos.cliente.ver',
      'cotizaciones.cliente.ver',
      'disenos.cliente.ver',
      'perfil.ver',
    ];
    const items = filterSidebarByPermissions(permissions, user);
    const labels = items.map((item) => item.label);

    expect(labels).toEqual([
      'Inicio',
      'Mis pedidos',
      'Mis cotizaciones',
      'Mis diseños',
      'Crear cotización',
      'Mi perfil',
    ]);
    expect(items.find(item => item.label === 'Inicio')?.to).toBe('/');
    expect(items.find(item => item.label === 'Mis pedidos')?.to).toBe('/dashboard');
    expect(items.find(item => item.label === 'Crear cotización')?.to).toBe('/cotizar');
    expect(labels).not.toContain('Usuarios');
    expect(labels).not.toContain('Compras');
    expect(labels).not.toContain('Ventas');
    expect(labels).not.toContain('Catalogo');
    expect(labels).not.toContain('Dashboard');
  });

  it('shows administrative sections according to permissions', () => {
    const user = { rol: { nombre: 'Admin' } };
    const permissions = [
      'dashboard.admin',
      'roles.ver',
      'usuarios.ver',
      'productos.ver',
      'categorias_producto.ver',
      'compras.ver',
    ];
    const labels = filterSidebarByPermissions(permissions, user).map((item) => item.label);

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Configuración');
    expect(labels).toContain('Usuarios');
    expect(labels).toContain('Catalogo');
    expect(labels).toContain('Compras');
    expect(labels).not.toContain('Mis pedidos');
  });

  it('uses only disenos.produccion for production queue visibility and route access', () => {
    const designer = { rol: { nombre: 'Diseñador' } };
    const allowedPermissions = ['disenos.produccion'];
    const deniedPermissions = ['pedidos.ver', 'pedidos.pasar_proceso', 'pedidos.finalizar', 'disenos.ver'];

    const allowedProduction = filterSidebarByPermissions(allowedPermissions, designer)
      .find((section) => section.label === 'Producción');
    const deniedProduction = filterSidebarByPermissions(deniedPermissions, designer)
      .find((section) => section.label === 'Producción');

    expect(ROUTE_PERMISSIONS[PATHS.PRODUCTION]).toEqual(['disenos.produccion']);
    expect(allowedProduction?.items.map((item) => item.label)).toContain('Cola de Producción');
    expect(canAccessPath(allowedPermissions, PATHS.PRODUCTION, designer)).toBe(true);
    expect(deniedProduction?.items.map((item) => item.label)).toEqual(['Gestión de Diseños']);
    expect(canAccessPath(deniedPermissions, PATHS.PRODUCTION, designer)).toBe(false);
  });

  it('keeps admin queue access and design management separated by their real permissions', () => {
    const admin = { rol: { nombre: 'Administrador' } };
    const permissions = ['dashboard.admin', 'disenos.produccion', 'disenos.ver'];
    const production = filterSidebarByPermissions(permissions, admin)
      .find((section) => section.label === 'Producción');

    expect(production?.items.map((item) => item.label)).toEqual([
      'Cola de Producción',
      'Gestión de Diseños',
    ]);
    expect(canAccessPath(permissions, PATHS.PRODUCTION, admin)).toBe(true);
    expect(canAccessPath(permissions, PATHS.PRODUCTION_DESIGNS, admin)).toBe(true);
  });
});
