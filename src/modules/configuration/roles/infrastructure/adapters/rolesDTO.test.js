import { describe, expect, it } from 'vitest';
import { createRole } from '../../domain/rolesModel';
import { rolesDTO } from './rolesDTO';

describe('rolesDTO', () => {
  it('maps roles, defaults and payloads', () => {
    expect(createRole({ id: 1, nombre: 'A', descripcion: 'D', estado: false })).toEqual({ id: 1, nombre: 'A', descripcion: 'D', estado: false });
    expect(rolesDTO.fromApi({ idRol: 2, nombre: 'Cliente' })).toEqual({ id: 2, nombre: 'Cliente', descripcion: '', estado: true });
    expect(rolesDTO.fromApi({ idRol: 3, estado: false }).estado).toBe(false);
    expect(rolesDTO.toApi({ nombre: '  Admin ', descripcion: ' x ', estado: true })).toEqual({ nombre: 'Admin', descripcion: 'x', estado: true });
  });
  it('handles empty and list inputs', () => {
    expect(rolesDTO.fromApi()).toBeNull();
    expect(rolesDTO.toApi()).toBeNull();
    expect(rolesDTO.fromApiList()).toEqual([]);
    expect(rolesDTO.fromApiList([{ idRol: 1 }])).toHaveLength(1);
  });
});
