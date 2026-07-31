import { describe, expect, it } from 'vitest';
import {
  formatActionName,
  formatModuleName,
  formatPermissionLabel,
  getPermissionDescription,
  sortPermissionsByAction,
} from './permissionLabels';

describe('permissionLabels', () => {
  it('formats known modules and actions in human language', () => {
    expect(formatModuleName('categorias_producto')).toBe('Categorías de productos');
    expect(formatModuleName('productos')).toBe('Productos cotizables');
    expect(formatActionName('confirmar')).toBe('Confirmar');
  });

  it('formats known permission codes with friendly labels', () => {
    expect(formatPermissionLabel('usuarios.ver')).toBe('Ver usuarios');
    expect(formatPermissionLabel('abonos.confirmar')).toBe('Confirmar abonos');
    expect(formatPermissionLabel('categorias_producto.ver')).toBe('Ver categorías de productos');
    expect(formatPermissionLabel('productos.precios')).toBe('Gestionar precios de productos');
    expect(formatPermissionLabel('dashboard.admin')).toBe('Ver dashboard administrador');
  });

  it('falls back to readable text for unknown permissions', () => {
    expect(formatPermissionLabel('reportes.exportar_excel')).toBe('Exportar Excel reportes');
  });

  it('keeps backend descriptions as secondary text', () => {
    expect(getPermissionDescription({
      codigo: 'usuarios.ver',
      descripcion: 'Consultar usuarios internos',
    })).toBe('Consultar usuarios internos');
  });

  it('sorts permissions by expected action priority', () => {
    const sorted = sortPermissionsByAction([
      { codigo: 'usuarios.eliminar', accion: 'eliminar' },
      { codigo: 'usuarios.ver', accion: 'ver' },
      { codigo: 'usuarios.crear', accion: 'crear' },
    ]);

    expect(sorted.map((permission) => permission.codigo)).toEqual([
      'usuarios.ver',
      'usuarios.crear',
      'usuarios.eliminar',
    ]);
  });
});
