import { describe, expect, it } from 'vitest';
import { createProveedor } from '../../domain/proveedor.model';
import { proveedorDTO } from './proveedor.dto';

describe('proveedorDTO', () => {
  it('creates defaults and maps API responses', () => {
    expect(createProveedor()).toEqual({ idProveedor: undefined, nombre: '', telefono: '', correo: '', direccion: '', estado: true });
    expect(proveedorDTO.fromApi({ idProveedor: 1, nombre: 'Telas', estado: false })).toMatchObject({ idProveedor: 1, nombre: 'Telas', estado: false });
    expect(proveedorDTO.fromApi()).toBeNull();
    expect(proveedorDTO.fromApiList()).toEqual([]);
    expect(proveedorDTO.fromApiList([{ idProveedor: 1 }, null])).toHaveLength(1);
  });
  it('trims nullable update and create payloads', () => {
    expect(proveedorDTO.toApi({ nombre: ' A ', telefono: ' ', correo: ' a@b.co ', direccion: '', estado: 1 })).toEqual({ nombre: 'A', telefono: null, correo: 'a@b.co', direccion: null, estado: true });
    expect(proveedorDTO.toApi({ nombre: 'B' })).toEqual({ nombre: 'B', telefono: null, correo: null, direccion: null });
    expect(proveedorDTO.toApiCreate({ nombre: ' C ', telefono: ' 1 ', correo: '', direccion: ' X ' })).toEqual({ nombre: 'C', telefono: '1', correo: null, direccion: 'X' });
  });
});
