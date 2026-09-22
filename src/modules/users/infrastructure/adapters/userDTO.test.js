import { describe, expect, it } from 'vitest';
import { User } from '../../domain/userModel';
import { userDTO } from './userDTO';

describe('userDTO and User', () => {
  it('maps nested and flat roles and applies display fallbacks', () => {
    const nested = userDTO.fromApi({ idUsuario: 1, rol: { idRol: 2, nombre: 'Admin' }, nombre: 'Ana', correo: 'a@b.co', estado: true });
    const flat = userDTO.fromApi({ idUsuario: 2, idRol: 3, nombre: 'Beto', documento: '10', telefono: '20', direccion: 'Calle', correo: 'b@b.co' });
    expect(nested).toBeInstanceOf(User);
    expect(nested).toMatchObject({ id: 1, idRol: 2, nombreRol: 'Admin', documento: 'Sin documento', telefono: 'Sin teléfono', direccion: 'Sin dirección' });
    expect(flat).toMatchObject({ idRol: 3, nombreRol: 'Sin Rol', documento: '10', telefono: '20', direccion: 'Calle' });
  });
  it('handles invalid and list inputs', () => {
    expect(userDTO.fromApi(null)).toBeNull();
    expect(userDTO.fromApiList(null)).toEqual([]);
    expect(userDTO.fromApiList([{ idUsuario: 1 }, { idUsuario: 2 }])).toHaveLength(2);
  });
});
