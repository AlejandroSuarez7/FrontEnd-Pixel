import { describe, expect, it } from 'vitest';
import { pedidoDTO } from './pedidoDTO';

describe('pedidoDTO', () => {
  it('maps alternate API names, nested quote values and design details', () => {
    const result = pedidoDTO.fromApi({
      idPedido: 9,
      idCotizacion: 4,
      total: '100',
      totalPagadoConfirmado: '30',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
      fecha_estimada_entrega: '2026-01-10',
      finalizado_at: '2026-01-11',
      entregado_at: '2026-01-12',
      cotizacion: {
        subtotal: '80',
        subtotalBruto: '90',
        subtotalConDescuento: '75',
        subtotalFinal: '100',
        descuentoTotal: '15',
        costosAdicionales: '20',
        costoDiseno: '5',
        detalles: [{
          idDetallePedido: 2,
          cantidad: '2',
          producto: { nombre: 'Camiseta', precioBase: '20' },
          descuento: '10',
          descuentoAplicado: '4',
          precioUnitario: '18',
          subtotal: '36',
          diseno: { idDiseno: 1 },
        }],
      },
      requerimientos: [{ id: 3 }],
    });

    expect(result).toMatchObject({
      idPedido: 9,
      subtotal: 80,
      subtotalBruto: 90,
      totalPagado: 30,
      fechaCreacion: '2026-01-01',
      fechaActualizacion: '2026-01-02',
      fechaEntregaEstimada: '2026-01-10',
      fechaFinalizado: '2026-01-11',
      fechaEntregado: '2026-01-12',
      requerimientosDiseno: [{ id: 3 }],
    });
    expect(result.detalles[0]).toMatchObject({
      descripcion: 'Camiseta',
      precioBase: 20,
      descuentoPorcentaje: 10,
      descuentoTotal: 4,
      requiereDiseno: true,
      origenDiseno: 'PIXEL',
      disenos: [{ idDiseno: 1 }],
    });
  });

  it('handles nulls, lists and empty details', () => {
    expect(pedidoDTO.fromApi(null)).toBeNull();
    expect(pedidoDTO.fromApiList(null)).toEqual([]);
    expect(pedidoDTO.fromApiList([null, { idPedido: 2 }])).toEqual([null, expect.objectContaining({ idPedido: 2 })]);
    expect(pedidoDTO.fromApi({ idPedido: 3, detalles: [] }).detalles).toEqual([]);
  });

  it('builds create and partial update payloads without blank text', () => {
    expect(pedidoDTO.toApiCreate({ idCotizacion: '7', observaciones: ' Nota ' })).toEqual({
      idCotizacion: 7,
      observaciones: 'Nota',
    });
    expect(pedidoDTO.toApiCreate({ idCotizacion: 7, observaciones: ' ' }).observaciones).toBeNull();
    expect(pedidoDTO.toApiUpdate({ observaciones: ' Cambio ', fechaEntregaEstimada: '' })).toEqual({
      observaciones: 'Cambio',
      fechaEntregaEstimada: null,
    });
    expect(pedidoDTO.toApiUpdate({})).toEqual({});
  });
});
