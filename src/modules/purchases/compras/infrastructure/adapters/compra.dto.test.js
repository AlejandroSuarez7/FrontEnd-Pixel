import { describe, expect, it } from 'vitest';
import { compraDTO } from './compra.dto';

describe('compraDTO', () => {
  it('maps API purchases and details with legacy date fields', () => {
    expect(compraDTO.fromApi(null)).toBeNull();
    const result = compraDTO.fromApi({
      idCompra: 1,
      idPedido: 2,
      total: '20',
      fecha_creacion: '2026-01-01',
      detalles: [{ descripcionInsumo: 'Tela', cantidad: '2', costoUnitario: '5', subtotal: '10' }],
    });
    expect(result).toMatchObject({ idCompra: 1, total: '20', fechaCompra: '2026-01-01' });
    expect(result.detalles[0]).toMatchObject({ cantidad: '2', costoUnitario: '5', subtotal: '10' });
    expect(compraDTO.fromApiList(null)).toEqual([]);
    expect(compraDTO.fromApiList([null, { idCompra: 2 }])).toHaveLength(1);
  });

  it('creates complete and partial API payloads', () => {
    expect(compraDTO.toApi({
      idPedido: '2', idProveedor: '3', observaciones: ' Nota ', confirmar: 1,
      detalles: [{ descripcionInsumo: ' Tela ', cantidad: '4', costoUnitario: '5' }],
    })).toEqual({
      idPedido: 2,
      idProveedor: 3,
      observaciones: 'Nota',
      confirmar: true,
      detalles: [{ descripcionInsumo: 'Tela', cantidad: 4, costoUnitario: 5 }],
    });
    expect(compraDTO.toApi({ idPedido: 1, idProveedor: 2, observaciones: '' })).not.toHaveProperty('confirmar');
    expect(compraDTO.toApiUpdate({ idProveedor: '4', observaciones: ' ', detalles: [] })).toEqual({
      idProveedor: 4, observaciones: null, detalles: [],
    });
    expect(compraDTO.toApiUpdate({})).toEqual({});
  });
});
