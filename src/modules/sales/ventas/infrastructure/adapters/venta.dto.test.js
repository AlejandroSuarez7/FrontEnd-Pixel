import { describe, expect, it } from 'vitest';
import { createVenta } from '../../domain/venta.model';
import { ventaDTO } from './venta.dto';

describe('ventaDTO', () => {
  it('creates defaults and maps a complete sale', () => {
    expect(createVenta({ idPedido: 1 })).toMatchObject({ idPedido: 1, idVenta: null, total: 0, estadoPago: 'PENDIENTE', tecnicas: [] });
    expect(ventaDTO.fromApi({ idPedido: 2, idVenta: 3, total: 100, tecnicas: ['DTF'], cantidadTotalProductos: 4 })).toMatchObject({ idPedido: 2, idVenta: 3, total: 100, tecnicas: ['DTF'], cantidadTotalProductos: 4 });
    expect(ventaDTO.fromApi({ idPedido: 3 })).toMatchObject({ tecnicas: [], cantidadTotalProductos: 0 });
  });
  it('handles invalid and list inputs', () => {
    expect(ventaDTO.fromApi()).toBeNull();
    expect(ventaDTO.fromApiList()).toEqual([]);
    expect(ventaDTO.fromApiList([{ idPedido: 1 }, null])).toHaveLength(1);
  });
});
