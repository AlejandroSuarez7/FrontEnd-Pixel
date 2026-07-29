import { describe, expect, it } from 'vitest';
import {
  filterSidebarByPermissions,
  getDefaultProtectedPath,
} from '../../routes/SIDEBAR_CONFIG';
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
      'disenos.cliente.ver',
      'perfil.ver',
    ];
    const items = filterSidebarByPermissions(permissions, user);
    const labels = items.map((item) => item.label);

    expect(labels).toEqual([
      'Inicio',
      'Dashboard',
      'Mis pedidos',
      'Mis disenos',
      'Crear cotizacion',
      'Mi Perfil',
    ]);
    expect(items.find(item => item.label === 'Inicio')?.to).toBe('/');
    expect(items.find(item => item.label === 'Dashboard')?.to).toBe('/dashboard');
    expect(items.find(item => item.label === 'Crear cotizacion')?.to).toBe('/#contacto');
    expect(labels).not.toContain('Usuarios');
    expect(labels).not.toContain('Compras');
    expect(labels).not.toContain('Ventas');
    expect(labels).not.toContain('Catalogo');
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
    expect(labels).toContain('Configuracion');
    expect(labels).toContain('Usuarios');
    expect(labels).toContain('Catalogo');
    expect(labels).toContain('Compras');
    expect(labels).not.toContain('Mis pedidos');
  });
});
